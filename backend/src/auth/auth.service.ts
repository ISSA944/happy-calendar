import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma';

export interface JwtPayload {
  sub: string;
  email: string | null;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_TTL_MIN = 15;
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, name?: string, consents?: boolean) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      update: { name: name ?? undefined },
      create: { email: normalizedEmail, name: name ?? null },
    });

    const code = randomInt(100_000, 1_000_000).toString();
    const otpHash = await bcrypt.hash(code, this.BCRYPT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + this.OTP_TTL_MIN * 60_000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpHash, otpExpiresAt },
    });

    // MOCK EMAIL — Phase 1 выводит в лог. Заменится на Resend/Mailgun позже.
    this.logger.log(
      `[MOCK EMAIL] OTP для ${normalizedEmail}: ${code} (TTL ${this.OTP_TTL_MIN} мин, consents=${consents ?? false})`,
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
