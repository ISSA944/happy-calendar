import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma';

export interface JwtPayload {
  sub: string;
  email: string | null;
  type: 'access' | 'refresh';
}

type EmailProvider = 'smtp' | 'resend' | 'none';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_TTL_MIN = 15;
  private readonly BCRYPT_ROUNDS = 10;

  private readonly smtpTransport: Transporter | null;
  private readonly smtpFromEmail: string;
  private readonly smtpFromName: string;

  private readonly resend: Resend | null;
  private readonly resendFromEmail: string;

  private readonly provider: EmailProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    // SMTP setup (preferred — delivers to any address)
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPassword = this.config.get<string>('SMTP_PASSWORD');
    const smtpPort = this.config.get<number>('SMTP_PORT') ?? 587;

    if (smtpHost && smtpUser && smtpPassword) {
      this.smtpTransport = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPassword },
      });
    } else {
      this.smtpTransport = null;
    }
    this.smtpFromEmail =
      this.config.get<string>('SMTP_FROM_EMAIL') ?? smtpUser ?? '';
    this.smtpFromName =
      this.config.get<string>('SMTP_FROM_NAME') ?? 'YoYoJoy Day';

    // Resend fallback (kept for future domain-verified prod)
    const resendKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = resendKey ? new Resend(resendKey) : null;
    this.resendFromEmail =
      this.config.get<string>('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev';

    this.provider = this.smtpTransport
      ? 'smtp'
      : this.resend
        ? 'resend'
        : 'none';

    this.logger.log(`Email provider: ${this.provider}`);
  }

  async register(email: string, name?: string, consents?: boolean) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      update: { name: name ?? undefined },
      create: { email: normalizedEmail, name: name ?? null },
    });

    if (consents !== undefined) {
      await this.prisma.prefs.upsert({
        where: { userId: user.id },
        update: { consentPd: consents },
        create: { userId: user.id, consentPd: consents },
      });
    }

    const code = randomInt(1000, 10_000).toString();
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';

    // Try to send email first (clean-state policy: save hash only on success).
    // In development: if email send fails for any reason, log code to terminal so
    // any email can be tested locally. In production: failure still throws 500.
    try {
      await this.sendOtpEmail(normalizedEmail, code);
    } catch (err) {
      if (!isDev) throw err;
      this.logger.warn(
        `\n⚠️  DEV MODE — email send failed for <${normalizedEmail}>.\n` +
        `   OTP code: [ ${code} ]  (enter this on the OTP page)\n`,
      );
    }

    const otpHash = await bcrypt.hash(code, this.BCRYPT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + this.OTP_TTL_MIN * 60_000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpHash, otpExpiresAt },
    });

    this.logger.log(`OTP отправлен на ${normalizedEmail} (TTL ${this.OTP_TTL_MIN} мин)`);

    return { ok: true, email: normalizedEmail };
  }

  async verifyOtp(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      throw new UnauthorizedException('OTP not requested');
    }
    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP expired');
    }

    const ok = await bcrypt.compare(code, user.otpHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Одноразовость: чистим OTP
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpiresAt: null },
    });

    // Создаём Profile/Prefs пустыми, если их ещё нет (upsert without update)
    await this.prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    await this.prisma.prefs.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Wrong token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Session revoked');
    }

    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  private async sendOtpEmail(to: string, code: string) {
    const EMAIL_FAILURE_MSG =
      'Не удалось отправить письмо с кодом. Попробуйте позже.';
    const subject = 'Твой код доступа к YoYoJoy Day';
    const html = this.renderOtpEmailHtml(code);

    if (this.provider === 'smtp' && this.smtpTransport) {
      try {
        const info = await this.smtpTransport.sendMail({
          from: `${this.smtpFromName} <${this.smtpFromEmail}>`,
          to,
          subject,
          html,
        });
        this.logger.log(`OTP email sent to ${to} via SMTP (id=${info.messageId})`);
        return;
      } catch (err) {
        this.logger.error(
          `SMTP send failed for ${to} (from=${this.smtpFromEmail})`,
          err instanceof Error ? err.stack : err,
        );
        throw new InternalServerErrorException(EMAIL_FAILURE_MSG);
      }
    }

    if (this.provider === 'resend' && this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: `YoYoJoy Day <${this.resendFromEmail}>`,
          to,
          subject,
          html,
        });
        if (error) {
          this.logger.error(
            `Resend API rejected email for ${to} (from=${this.resendFromEmail}): ${JSON.stringify(error)}`,
          );
          throw new InternalServerErrorException(EMAIL_FAILURE_MSG);
        }
        this.logger.log(`OTP email sent to ${to} via Resend (id=${data?.id ?? 'n/a'})`);
        return;
      } catch (err) {
        if (err instanceof InternalServerErrorException) throw err;
        this.logger.error(
          `Unexpected Resend error for ${to}`,
          err instanceof Error ? err.stack : err,
        );
        throw new InternalServerErrorException(EMAIL_FAILURE_MSG);
      }
    }

    this.logger.error('No email provider configured (set SMTP_* or RESEND_API_KEY)');
    throw new InternalServerErrorException(EMAIL_FAILURE_MSG);
  }

  private renderOtpEmailHtml(code: string): string {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>YoYoJoy Day</title>
</head>
<body style="margin:0;padding:32px 16px;background:#f5f2ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2a3f3e">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#fcf9f4;border-radius:24px;overflow:hidden">
          <tr>
            <td style="padding:40px 40px 28px;background:#006a65;text-align:center">
              <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px">YoYoJoy Day 🌿</div>
              <div style="color:#a4d8d5;font-size:13px;margin-top:6px">Твой персональный компаньон дня</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 8px">
              <p style="margin:0 0 28px;font-size:16px;line-height:1.55;color:#2a3f3e">
                Привет! Вот твой одноразовый код для входа:
              </p>
              <div style="text-align:center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto">
                  <tr>
                    ${code.split('').map(d => `
                    <td style="padding:0 5px">
                      <div style="width:56px;height:72px;background:#f0fafa;border:2px solid #2FA7A0;border-radius:14px;text-align:center;line-height:72px;font-size:40px;font-weight:800;color:#006a65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">${d}</div>
                    </td>`).join('')}
                  </tr>
                </table>
              </div>
              <p style="margin:28px 0 0;font-size:14px;line-height:1.55;color:#5a6968">
                Код действует <strong style="color:#006a65">${this.OTP_TTL_MIN} минут</strong>. Никому его не передавай — мы не запрашиваем коды в чатах и сообщениях.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 40px">
              <div style="border-top:1px solid #e8e3db;padding-top:24px">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#8a9998;text-align:center">
                  Если ты не запрашивал(а) код — просто проигнорируй это письмо.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private async issueTokens(userId: string, email: string | null) {
    const accessPayload: JwtPayload = { sub: userId, email, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, email, type: 'refresh' };

    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessTtl = this.config.getOrThrow<string>('JWT_ACCESS_TTL');
    const refreshTtl = this.config.getOrThrow<string>('JWT_REFRESH_TTL');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload as object, {
        secret: accessSecret,
        expiresIn: accessTtl as unknown as number,
      }),
      this.jwt.signAsync(refreshPayload as object, {
        secret: refreshSecret,
        expiresIn: refreshTtl as unknown as number,
      }),
    ]);

    // Rotate: храним хэш нового refresh. Старый невалиден.
    const refreshHash = await bcrypt.hash(refreshToken, this.BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: refreshHash },
    });

    return { accessToken, refreshToken };
  }
}
