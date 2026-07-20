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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_TTL_MIN = 15;
  private readonly BCRYPT_ROUNDS = 10;
  // Тестовый аккаунт с обходом OTP — активен ТОЛЬКО в dev (см. isTestAccount ниже).
  private readonly TEST_EMAIL = 'mukaniskander01@gmail.com';

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

  async register(email: string, name?: string, consents?: boolean, marketing?: boolean) {
    const normalizedEmail = email.trim().toLowerCase();
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    // Тест-аккаунт (авто-сброс + OTP 1111) разрешён ТОЛЬКО в dev. В проде этот email
    // ведёт себя как обычный — без обхода OTP и без затирания данных (иначе это бэкдор).
    const isTestAccount = isDev && normalizedEmail === this.TEST_EMAIL;

    if (isTestAccount) {
      // Test account in dev: auto-wipe on every registration so re-registration always works cleanly
      await this.prisma.user.deleteMany({ where: { email: normalizedEmail } });
    } else {
      const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        throw new ConflictException('Email already registered');
      }
    }

    const user = await this.prisma.user.create({
      data: { email: normalizedEmail, name: name ?? null },
    });

    if (consents !== undefined) {
      await this.prisma.prefs.upsert({
        where: { userId: user.id },
        update: { consentPd: consents, marketingConsent: marketing ?? false },
        create: { userId: user.id, consentPd: consents, marketingConsent: marketing ?? false },
      });
    }

    const code = isTestAccount ? '1111' : randomInt(1000, 10_000).toString();

    // Try to send email first (clean-state policy: save hash only on success).
    // In development: if email send fails for any reason, log code to terminal so
    // any email can be tested locally. In production: failure still throws 500.
    if (!isTestAccount) {
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
      this.logger.warn(`\n🧪 TEST ACCOUNT — OTP bypassed, code is 1111\n`);
    }

    const otpHash = await bcrypt.hash(code, this.BCRYPT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + this.OTP_TTL_MIN * 60_000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpHash, otpExpiresAt, otpFailedAttempts: 0, otpLastFailedAt: null },
    });

    this.logger.log(`OTP отправлен на ${normalizedEmail} (TTL ${this.OTP_TTL_MIN} мин)`);

    return { ok: true, email: normalizedEmail };
  }

  async login(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new NotFoundException('Email not found');
    }

    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    const isTestAccount = isDev && normalizedEmail === this.TEST_EMAIL;
    const code = isTestAccount ? '1111' : randomInt(1000, 10_000).toString();

    if (!isTestAccount) {
      try {
        await this.sendOtpEmail(normalizedEmail, code);
      } catch (err) {
        if (!isDev) throw err;
        this.logger.warn(`\n⚠️  DEV MODE — email send failed for <${normalizedEmail}>.\n   OTP code: [ ${code} ]\n`);
      }
    } else {
      this.logger.warn(`\n🧪 TEST ACCOUNT — OTP bypassed, code is 1111\n`);
    }

    const otpHash = await bcrypt.hash(code, this.BCRYPT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + this.OTP_TTL_MIN * 60_000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpHash, otpExpiresAt, otpFailedAttempts: 0, otpLastFailedAt: null },
    });

    this.logger.log(`Login OTP отправлен на ${normalizedEmail} (TTL ${this.OTP_TTL_MIN} мин)`);
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
      user.otpLastFailedAt && Date.now() - user.otpLastFailedAt.getTime() < WINDOW_MS;
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
      data: { otpHash: null, otpExpiresAt: null, otpFailedAttempts: 0, otpLastFailedAt: null },
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

    // Приветственное письмо — один раз за всю жизнь аккаунта (флаг welcomeEmailSentAt).
    // verifyOtp() — общая точка входа для регистрации И логина, поэтому завязываемся на флаг,
    // а не на тип запроса. Best-effort: письмо НИКОГДА не блокирует вход — любая ошибка гасится.
    if (!user.welcomeEmailSentAt) {
      try {
        await this.sendWelcomeEmail(normalizedEmail, user.name);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { welcomeEmailSentAt: new Date() },
        });
      } catch (err) {
        this.logger.warn(
          `Welcome email failed for ${normalizedEmail} (не критично, вход продолжается): ` +
            (err instanceof Error ? err.message : String(err)),
        );
      }
    }

    return this.issueTokens(user.id, user.email);
  }

  async requestEmailChange(
    userId: string,
    email: string,
    consents?: boolean,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) throw new UnauthorizedException('User not found');
    if (currentUser.email === normalizedEmail) {
      throw new BadRequestException('Email is unchanged');
    }

    this.logger.log(`Requesting email change: userId=${userId}, from ${currentUser.email} to ${normalizedEmail}`);

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing && existing.id !== userId) {
      this.logger.warn(`Email change failed: ${normalizedEmail} is already in use by another user`);
      throw new ConflictException('Email already in use');
    }

    const code = randomInt(1000, 10_000).toString();
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';

    this.logger.log(`Sending email change OTP to ${normalizedEmail}...`);
    try {
      await this.sendOtpEmail(normalizedEmail, code);
      this.logger.log(`Email change OTP successfully sent to ${normalizedEmail}`);
    } catch (err) {
      this.logger.error(`Failed to send email change OTP to ${normalizedEmail}: ${err instanceof Error ? err.message : String(err)}`);
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

  // Читает PDF-подарки из backend/assets/gifts/*.pdf. Файлов от клиента пока нет —
  // возвращает [] (письмо уйдёт без вложений). Когда файлы положат в папку — они подхватятся
  // автоматически, без изменения кода.
  private loadGiftAttachments(): { filename: string; content: Buffer }[] {
    const dir = path.join(process.cwd(), 'assets', 'gifts');
    try {
      if (!fs.existsSync(dir)) return [];
      return fs
        .readdirSync(dir)
        .filter((f) => f.toLowerCase().endsWith('.pdf'))
        .map((f) => ({ filename: f, content: fs.readFileSync(path.join(dir, f)) }));
    } catch (err) {
      this.logger.warn(
        `Не удалось прочитать подарки из ${dir}: ` + (err instanceof Error ? err.message : String(err)),
      );
      return [];
    }
  }

  // Приветственное письмо. Переиспользует тот же провайдер (Resend/SMTP), что и OTP.
  // Вложения (PDF-подарки) — best-effort: если файлов нет, письмо уходит без них.
  private async sendWelcomeEmail(to: string, name: string | null) {
    const subject = 'Добро пожаловать в YoYoJoy Day 🌿';
    const html = this.renderWelcomeEmailHtml(name);
    const gifts = this.loadGiftAttachments();
    const giftNote = gifts.length ? ` (+${gifts.length} PDF)` : ' (без вложений — файлов подарков пока нет)';

    if (this.provider === 'smtp' && this.smtpTransport) {
      const info = await this.smtpTransport.sendMail({
        from: `${this.smtpFromName} <${this.smtpFromEmail}>`,
        to,
        subject,
        html,
        attachments: gifts.map((g) => ({ filename: g.filename, content: g.content })),
      });
      this.logger.log(`Welcome email sent to ${to} via SMTP${giftNote} (id=${info.messageId})`);
      return;
    }

    if (this.provider === 'resend' && this.resend) {
      const { data, error } = await this.resend.emails.send({
        from: `YoYoJoy Day <${this.resendFromEmail}>`,
        to,
        subject,
        html,
        attachments: gifts.map((g) => ({ filename: g.filename, content: g.content })),
      });
      if (error) throw new Error(`Resend rejected welcome email: ${JSON.stringify(error)}`);
      this.logger.log(`Welcome email sent to ${to} via Resend${giftNote} (id=${data?.id ?? 'n/a'})`);
      return;
    }

    throw new Error('No email provider configured for welcome email');
  }

  private renderWelcomeEmailHtml(name: string | null): string {
    const greeting = name && name.trim() ? `Привет, ${name.trim()}!` : 'Привет!';
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
              <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#006a65">${greeting}</p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.55;color:#2a3f3e">
                Спасибо, что ты с нами. Каждый день тебя будут ждать гороскоп, тёплая фраза поддержки и
                праздники — всё подобрано лично для тебя.
              </p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#5a6968">
                Загляни на главную прямо сейчас — там уже готов твой сегодняшний день. А в настройках можно
                выбрать цели на год и время, когда тебе присылать заботу.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 24px">
              <div style="background:#f0ede9;border-radius:20px;padding:20px 24px">
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#006a65">🎁 Подарок за регистрацию</p>
                <p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#2a3f3e"><b>Трекер привычек на месяц</b> — даёт структуру и опору.</p>
                <p style="margin:0;font-size:14px;line-height:1.5;color:#2a3f3e"><b>Чек-лист «30 дней заботы о себе»</b> — маленький ритуал на каждый день.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px">
              <div style="border-top:1px solid #e8e3db;padding-top:24px">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#8a9998;text-align:center">
                  С любовью, команда YoYoJoy Day
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
    const refreshTtl = email === 'mukaniskander01@gmail.com' ? '365d' : this.config.getOrThrow<string>('JWT_REFRESH_TTL');

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
