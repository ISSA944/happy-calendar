import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException, // used in login()
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Resend } from 'resend';
import type { User } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma';

export interface JwtPayload {
  sub: string;
  email: string | null;
  type: 'access' | 'refresh';
}

type EmailProvider = 'smtp' | 'resend' | 'none';

type TestAccountPolicy = {
  fixedOtp: string;
  sendOtpEmail: boolean;
  resetOnDevRegistration: boolean;
  refreshTtl: string;
};

const TEST_ACCOUNT_POLICIES: Record<string, TestAccountPolicy> = {
  'mukaniskander01@gmail.com': {
    fixedOtp: '1111',
    sendOtpEmail: false,
    resetOnDevRegistration: true,
    refreshTtl: '365d',
  },
  'metrolabsgroup@gmail.com': {
    fixedOtp: '1111',
    sendOtpEmail: true,
    resetOnDevRegistration: false,
    refreshTtl: '365d',
  },
};

type ResendEmailResult = {
  data?: { id?: string } | null;
  error?: object | null;
};

function asResendEmailResult(value: unknown): ResendEmailResult {
  return typeof value === 'object' && value !== null ? value : {};
}

function messageIdOf(value: unknown): string {
  if (
    typeof value === 'object' &&
    value !== null &&
    'messageId' in value &&
    typeof value.messageId === 'string'
  ) {
    return value.messageId;
  }
  return 'n/a';
}

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
    // 1. Resend Setup (Preferred for production stability)
    const resendKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = resendKey ? new Resend(resendKey) : null;
    this.resendFromEmail =
      this.config.get<string>('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev';

    // 2. SMTP Setup (Fallback)
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

    // 3. Provider selection (Prioritize Resend if key is provided)
    this.provider = this.resend
      ? 'resend'
      : this.smtpTransport
        ? 'smtp'
        : 'none';

    this.logger.log(`Email provider: ${this.provider}`);
  }

  private testAccountPolicy(email: string): TestAccountPolicy | null {
    return TEST_ACCOUNT_POLICIES[email] ?? null;
  }

  async register(
    email: string,
    name?: string,
    consents?: boolean,
    marketing?: boolean,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    // Фиксированный OTP тестовых аккаунтов активен во всех окружениях, включая production.
    // Это осознанный риск: политика жёстко ограничена перечисленными выше адресами.
    const testPolicy = this.testAccountPolicy(normalizedEmail);

    let user: User;

    if (testPolicy?.resetOnDevRegistration && isDev) {
      // Test account in dev: auto-wipe on every registration so re-registration always works cleanly
      await this.prisma.user.deleteMany({ where: { email: normalizedEmail } });
      user = await this.prisma.user.create({
        data: { email: normalizedEmail, name: name ?? null },
      });
    } else {
      const existing = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existing) {
        if (existing.emailVerifiedAt) {
          throw new ConflictException('Email already registered');
        }
        user = existing;
      } else {
        user = await this.prisma.user.create({
          data: { email: normalizedEmail, name: name ?? null },
        });
      }
    }

    if (consents !== undefined) {
      await this.prisma.prefs.upsert({
        where: { userId: user.id },
        update: { consentPd: consents, marketingConsent: marketing ?? false },
        create: {
          userId: user.id,
          consentPd: consents,
          marketingConsent: marketing ?? false,
        },
      });
    }

    const code = testPolicy?.fixedOtp ?? randomInt(1000, 10_000).toString();

    // Try to send email first (clean-state policy: save hash only on success).
    // In development: if email send fails for any reason, log code to terminal so
    // any email can be tested locally. In production: failure still throws 500.
    if (!testPolicy || testPolicy.sendOtpEmail) {
      try {
        await this.sendOtpEmail(normalizedEmail, code);
      } catch (err) {
        if (!isDev) throw err;
        this.logger.warn(
          `\n⚠️  DEV MODE — email send failed for <${normalizedEmail}>.\n` +
            `   OTP code: [ ${code} ]  (enter this on the OTP page)\n`,
        );
      }
    } else {
      this.logger.warn(
        `\n🧪 TEST ACCOUNT — OTP email bypassed, code is ${code}\n`,
      );
    }

    let giftEmailAccepted = Boolean(user.welcomeEmailSentAt);
    if (!giftEmailAccepted) {
      try {
        await this.sendWelcomeEmail(normalizedEmail, user.name);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { welcomeEmailSentAt: new Date() },
        });
        giftEmailAccepted = true;
      } catch (err) {
        if (!isDev) throw err;
        this.logger.warn(
          `DEV MODE — welcome email failed for ${normalizedEmail}: ` +
            (err instanceof Error ? err.message : String(err)),
        );
      }
    }

    const otpHash = await bcrypt.hash(code, this.BCRYPT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + this.OTP_TTL_MIN * 60_000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash,
        otpExpiresAt,
        otpFailedAttempts: 0,
        otpLastFailedAt: null,
      },
    });

    this.logger.log(
      `OTP отправлен на ${normalizedEmail} (TTL ${this.OTP_TTL_MIN} мин)`,
    );

    return { ok: true, email: normalizedEmail, giftEmailAccepted };
  }

  async login(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      throw new NotFoundException('Email not found');
    }

    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    const testPolicy = this.testAccountPolicy(normalizedEmail);
    const code = testPolicy?.fixedOtp ?? randomInt(1000, 10_000).toString();

    if (!testPolicy || testPolicy.sendOtpEmail) {
      try {
        await this.sendOtpEmail(normalizedEmail, code);
      } catch (err) {
        if (!isDev) throw err;
        this.logger.warn(
          `\n⚠️  DEV MODE — email send failed for <${normalizedEmail}>.\n   OTP code: [ ${code} ]\n`,
        );
      }
    } else {
      this.logger.warn(
        `\n🧪 TEST ACCOUNT — OTP email bypassed, code is ${code}\n`,
      );
    }

    const otpHash = await bcrypt.hash(code, this.BCRYPT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + this.OTP_TTL_MIN * 60_000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash,
        otpExpiresAt,
        otpFailedAttempts: 0,
        otpLastFailedAt: null,
      },
    });

    this.logger.log(
      `Login OTP отправлен на ${normalizedEmail} (TTL ${this.OTP_TTL_MIN} мин)`,
    );
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

    // Per-email brute-force защита: после 5 неверных попыток за 15 минут блокируем.
    const MAX_ATTEMPTS = 5;
    const WINDOW_MS = 15 * 60_000;
    const recentlyFailed =
      user.otpLastFailedAt &&
      Date.now() - user.otpLastFailedAt.getTime() < WINDOW_MS;
    if (recentlyFailed && user.otpFailedAttempts >= MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many attempts. Request a new code.');
    }

    const ok = await bcrypt.compare(code, user.otpHash);
    if (!ok) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          otpFailedAttempts: recentlyFailed ? user.otpFailedAttempts + 1 : 1,
          otpLastFailedAt: new Date(),
        },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    // Одноразовость: чистим OTP + сбрасываем счётчик
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash: null,
        otpExpiresAt: null,
        otpFailedAttempts: 0,
        otpLastFailedAt: null,
        emailVerifiedAt: new Date(),
      },
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

  async requestEmailChange(userId: string, email: string, consents?: boolean) {
    const normalizedEmail = email.trim().toLowerCase();
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!currentUser) throw new UnauthorizedException('User not found');
    if (currentUser.email === normalizedEmail) {
      throw new BadRequestException('Email is unchanged');
    }

    this.logger.log(
      `Requesting email change: userId=${userId}, from ${currentUser.email} to ${normalizedEmail}`,
    );

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing && existing.id !== userId) {
      this.logger.warn(
        `Email change failed: ${normalizedEmail} is already in use by another user`,
      );
      throw new ConflictException('Email already in use');
    }

    const code = randomInt(1000, 10_000).toString();
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';

    this.logger.log(`Sending email change OTP to ${normalizedEmail}...`);
    try {
      await this.sendOtpEmail(normalizedEmail, code);
      this.logger.log(
        `Email change OTP successfully sent to ${normalizedEmail}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send email change OTP to ${normalizedEmail}: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (!isDev) throw err;
      this.logger.warn(
        `\n⚠️  DEV MODE — email change send failed for <${normalizedEmail}>.\n` +
          `   OTP code: [ ${code} ]  (enter this on the email-change OTP page)\n`,
      );
    }

    const otpHash = await bcrypt.hash(code, this.BCRYPT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + this.OTP_TTL_MIN * 60_000);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          pendingEmail: normalizedEmail,
          emailChangeOtpHash: otpHash,
          emailChangeOtpExpiresAt: otpExpiresAt,
        },
      }),
      consents !== undefined
        ? this.prisma.prefs.upsert({
            where: { userId },
            update: { consentPd: consents },
            create: { userId, consentPd: consents },
          })
        : this.prisma.prefs.upsert({
            where: { userId },
            update: {},
            create: { userId },
          }),
    ]);

    return { ok: true, email: normalizedEmail };
  }

  async verifyEmailChange(userId: string, email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user ||
      user.pendingEmail !== normalizedEmail ||
      !user.emailChangeOtpHash ||
      !user.emailChangeOtpExpiresAt
    ) {
      throw new UnauthorizedException('Email change OTP not requested');
    }

    if (user.emailChangeOtpExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP expired');
    }

    const ok = await bcrypt.compare(code, user.emailChangeOtpHash);
    if (!ok) throw new UnauthorizedException('Invalid OTP');

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Email already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
        pendingEmail: null,
        emailChangeOtpHash: null,
        emailChangeOtpExpiresAt: null,
        refreshTokenHash: null,
      },
    });

    return this.issueTokens(updated.id, updated.email);
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
        const info: unknown = await this.smtpTransport.sendMail({
          from: `${this.smtpFromName} <${this.smtpFromEmail}>`,
          to,
          subject,
          html,
        });
        this.logger.log(
          `OTP email sent to ${to} via SMTP (id=${messageIdOf(info)})`,
        );
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
        const result = asResendEmailResult(
          await this.resend.emails.send({
            from: `YoYoJoy Day <${this.resendFromEmail}>`,
            to,
            subject,
            html,
          }),
        );
        if (result.error) {
          this.logger.error(
            `Resend API rejected email for ${to} (from=${this.resendFromEmail}): ${JSON.stringify(result.error)}`,
          );
          throw new InternalServerErrorException(EMAIL_FAILURE_MSG);
        }
        this.logger.log(
          `OTP email sent to ${to} via Resend (id=${result.data?.id ?? 'n/a'})`,
        );
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

    this.logger.error(
      'No email provider configured (set SMTP_* or RESEND_API_KEY)',
    );
    throw new InternalServerErrorException(EMAIL_FAILURE_MSG);
  }

  private renderOtpEmailHtml(code: string): string {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>YoYoJoy Day</title>
</head>
<body style="margin:0;padding:16px 8px;background:#f5f2ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2a3f3e">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:480px;background:#fcf9f4;border-radius:24px;overflow:hidden">
          <tr>
            <td style="padding:32px 20px 24px;background:#006a65;text-align:center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="padding:0 8px 0 0;vertical-align:middle"><img src="${this.brandLeafIconUrl}" width="28" height="28" alt="" style="display:block;border:0;outline:none"></td>
                  <td style="vertical-align:middle;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px">YoYoJoy Day</td>
                </tr>
              </table>
              <div style="color:#a4d8d5;font-size:13px;margin-top:6px">Твой персональный компаньон дня</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 20px 8px">
              <p style="margin:0 0 28px;font-size:16px;line-height:1.55;color:#2a3f3e">
                Привет! Вот твой одноразовый код для входа:
              </p>
              <div style="text-align:center">
                <div style="display:inline-block;max-width:100%;box-sizing:border-box;padding:14px 18px 14px 26px;background:#f0fafa;border:2px solid #2FA7A0;border-radius:14px;font-size:32px;font-weight:800;line-height:1.2;letter-spacing:8px;color:#006a65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;white-space:nowrap">${code}</div>
              </div>
              <p style="margin:28px 0 0;font-size:14px;line-height:1.55;color:#5a6968">
                Код действует <strong style="color:#006a65">${this.OTP_TTL_MIN} минут</strong>. Никому его не передавай — мы не запрашиваем коды в чатах и сообщениях.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 20px 32px">
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

  // Читает два production PDF-подарка из backend/assets/gifts/*.pdf.
  private loadGiftAttachments(): { filename: string; content: Buffer }[] {
    const dir = path.join(process.cwd(), 'assets', 'gifts');
    try {
      if (!fs.existsSync(dir)) return [];
      return fs
        .readdirSync(dir)
        .filter((f) => f.toLowerCase().endsWith('.pdf'))
        .map((f) => ({
          filename: f,
          content: fs.readFileSync(path.join(dir, f)),
        }));
    } catch (err) {
      this.logger.warn(
        `Не удалось прочитать подарки из ${dir}: ` +
          (err instanceof Error ? err.message : String(err)),
      );
      return [];
    }
  }

  // Подарочное письмо отправляется только из register(), до перехода пользователя на OTP.
  // Переиспользует тот же провайдер (Resend/SMTP), что и письмо с кодом.
  private async sendWelcomeEmail(to: string, name: string | null) {
    const subject = 'Добро пожаловать в YoYoJoy Day';
    const gifts = this.loadGiftAttachments();
    const giftNames = new Set(gifts.map((gift) => gift.filename));
    if (
      gifts.length !== 2 ||
      !giftNames.has('habit-tracker.pdf') ||
      !giftNames.has('self-care-checklist-30-days.pdf')
    ) {
      throw new Error('Both PDF gifts are required for registration email');
    }
    const trackerFile =
      gifts.find((g) => g.filename.toLowerCase().includes('tracker'))
        ?.filename ?? null;
    const checklistFile =
      gifts.find((g) => g.filename.toLowerCase().includes('checklist'))
        ?.filename ?? null;
    const html = this.renderWelcomeEmailHtml(name, trackerFile, checklistFile);
    const giftNote = gifts.length
      ? ` (+${gifts.length} PDF)`
      : ' (без вложений — файлов подарков пока нет)';

    if (this.provider === 'smtp' && this.smtpTransport) {
      const info: unknown = await this.smtpTransport.sendMail({
        from: `${this.smtpFromName} <${this.smtpFromEmail}>`,
        to,
        subject,
        html,
        attachments: gifts.map((g) => ({
          filename: g.filename,
          content: g.content,
        })),
      });
      this.logger.log(
        `Welcome email sent to ${to} via SMTP${giftNote} (id=${messageIdOf(info)})`,
      );
      return;
    }

    if (this.provider === 'resend' && this.resend) {
      const result = asResendEmailResult(
        await this.resend.emails.send({
          from: `YoYoJoy Day <${this.resendFromEmail}>`,
          to,
          subject,
          html,
          attachments: gifts.map((g) => ({
            filename: g.filename,
            content: g.content,
          })),
        }),
      );
      if (result.error)
        throw new Error(
          `Resend rejected welcome email: ${JSON.stringify(result.error)}`,
        );
      this.logger.log(
        `Welcome email sent to ${to} via Resend${giftNote} (id=${result.data?.id ?? 'n/a'})`,
      );
      return;
    }

    throw new Error('No email provider configured for welcome email');
  }

  // Логотипы — PNG (не SVG: Gmail/Outlook режут SVG в письмах), хостятся на фронтенд-домене
  // из public/email-assets/*.png (deploy.sh копирует dist/ целиком, public/ уже часть сборки).
  private readonly brandLeafIconUrl =
    'https://yoyojoy.online/email-assets/brand-leaf.png';
  private readonly telegramLogoUrl =
    'https://yoyojoy.online/email-assets/telegram.png';
  private readonly maxLogoUrl = 'https://yoyojoy.online/email-assets/max.png';
  // Иконки подарков — Material Symbols Outlined (та же семья, что material-symbols-outlined
  // по всему приложению), отрисованы в PNG через sharp вместо эмодзи 📅/✅ (не рендерятся
  // консистентно в Gmail/Outlook), заливка Zen-Emerald #006a65.
  private readonly giftTrackerIconUrl =
    'https://yoyojoy.online/email-assets/gift-tracker.png';
  private readonly giftChecklistIconUrl =
    'https://yoyojoy.online/email-assets/gift-checklist.png';

  private renderWelcomeEmailHtml(
    name: string | null,
    trackerFile: string | null,
    checklistFile: string | null,
  ): string {
    const greeting =
      name && name.trim() ? `Привет, ${name.trim()}!` : 'Привет!';
    const telegramUrl = this.config.get<string>('TELEGRAM_CHANNEL_URL');
    const maxUrl = this.config.get<string>('MAX_CHANNEL_URL');

    // Кнопки каналов — только если ссылка реально настроена (см. env.validation.ts), чтобы
    // никогда не отправить письмо с "мёртвой" ссылкой на канал.
    const channelButtons = [
      telegramUrl
        ? `<td width="50%" style="padding:0 6px 0 0;">
             <a href="${telegramUrl}" target="_blank" style="display:block;text-align:center;background:#0E6E62;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 0;border-radius:999px;">
               <img src="${this.telegramLogoUrl}" width="22" height="22" alt="" style="vertical-align:middle;margin-right:8px;border:0;">Телеграм</a>
           </td>`
        : '',
      maxUrl
        ? `<td width="50%" style="padding:0 0 0 6px;">
             <a href="${maxUrl}" target="_blank" style="display:block;text-align:center;background:#0E6E62;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 0;border-radius:999px;">
               <img src="${this.maxLogoUrl}" width="22" height="22" alt="" style="vertical-align:middle;margin-right:8px;border:0;">МАКС</a>
           </td>`
        : '',
    ]
      .filter(Boolean)
      .join('');

    const channelsSection = channelButtons
      ? `<tr>
           <td style="padding:4px 20px 2px;">
             <p style="margin:0 0 2px;font-size:17px;font-weight:bold;color:#23302b;text-align:center;">Подписывайся на наши каналы</p>
             <p style="margin:6px 0 18px;font-size:14px;line-height:1.5;color:#54605b;text-align:center;">Там ещё больше тёплого, полезного и интересного — каждый день.</p>
           </td>
         </tr>
         <tr>
           <td style="padding:0 20px 22px;">
             <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>${channelButtons}</tr></table>
           </td>
         </tr>`
      : '';

    return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>YoYoJoy Day</title>
</head>
<body style="margin:0;padding:16px 8px;background:#F0EBE1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2a3f3e">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Держи подарки за регистрацию: трекер привычек и чек-лист «30 дней заботы о себе» — внутри.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%;background:#FAF6EF;border-radius:24px;overflow:hidden">
          <tr>
            <td style="background:#0E6E62;padding:32px 20px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="padding:0 8px 0 0;vertical-align:middle"><img src="${this.brandLeafIconUrl}" width="30" height="30" alt="" style="display:block;border:0;outline:none"></td>
                  <td style="vertical-align:middle;font-size:24px;font-weight:bold;color:#ffffff;letter-spacing:.2px;">YoYoJoy Day</td>
                </tr>
              </table>
              <div style="font-size:14px;color:#A9D6CE;margin-top:8px;">Твой персональный компаньон дня</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 20px 8px;color:#2C3A35;">
              <p style="font-size:20px;font-weight:bold;margin:0 0 10px;">${greeting} Рады, что ты с нами</p>
              <p style="font-size:16px;line-height:1.6;color:#54605b;margin:0 0 26px;">
                Спасибо за регистрацию в YoYoJoy. Держи два маленьких подарка — чтобы заботиться о себе было ещё теплее и проще.
                Оба файла уже <b>во вложении к этому письму</b>.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#E9F3EF;border-radius:16px;margin:0 0 14px;">
                <tr>
                  <td width="64" style="padding:18px 0 18px 18px;vertical-align:top;">
                    <div style="width:46px;height:46px;background:rgba(0,106,101,0.10);border-radius:50%;text-align:center;line-height:46px;"><img src="${this.giftTrackerIconUrl}" width="22" height="22" alt="" style="vertical-align:middle;border:0;"></div>
                  </td>
                  <td style="padding:18px 18px 18px 14px;vertical-align:top;">
                    <div style="font-size:16px;font-weight:bold;color:#23302b;">Трекер привычек на месяц</div>
                    <div style="font-size:14px;line-height:1.5;color:#54605b;margin-top:4px;">Простая структура, чтобы мягко закрепить полезные ритмы и видеть свой прогресс.</div>
                    <div style="font-size:12px;color:#8B948F;margin-top:6px;">${trackerFile ?? 'Трекер-привычек.pdf'}</div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#E9F3EF;border-radius:16px;margin:0 0 26px;">
                <tr>
                  <td width="64" style="padding:18px 0 18px 18px;vertical-align:top;">
                    <div style="width:46px;height:46px;background:rgba(0,106,101,0.10);border-radius:50%;text-align:center;line-height:46px;"><img src="${this.giftChecklistIconUrl}" width="22" height="22" alt="" style="vertical-align:middle;border:0;"></div>
                  </td>
                  <td style="padding:18px 18px 18px 14px;vertical-align:top;">
                    <div style="font-size:16px;font-weight:bold;color:#23302b;">Чек-лист «30 дней заботы о себе»</div>
                    <div style="font-size:14px;line-height:1.5;color:#54605b;margin-top:4px;">Тёплый микро-ритуал на каждый день: маленькие шаги, из которых складывается забота.</div>
                    <div style="font-size:12px;color:#8B948F;margin-top:6px;">${checklistFile ?? '30-дней-заботы-о-себе.pdf'}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${channelsSection}
          <tr>
            <td style="padding:14px 20px 32px;">
              <div style="border-top:1px solid #ECE3D4;margin:0 0 16px;"></div>
              <p style="font-size:12px;line-height:1.6;color:#A7A296;margin:0;text-align:center;">
                Ты получил(а) это письмо, потому что зарегистрировался(ась) в YoYoJoy.<br>
                С заботой, команда YoYoJoy
              </p>
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
    const refreshTtl =
      (email && this.testAccountPolicy(email)?.refreshTtl) ??
      this.config.getOrThrow<string>('JWT_REFRESH_TTL');

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
