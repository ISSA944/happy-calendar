import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { PrismaService } from '../prisma';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  birthdate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  zodiacSign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'pushTime must be HH:MM' })
  pushTime?: string;

  @IsOptional()
  @IsBoolean()
  horoscopeEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  holidaysEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFullProfile(userId: string) {
    const [user, profile, prefs] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.prefs.findUnique({ where: { userId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    return { user, profile, prefs };
  }

  async patch(userId: string, dto: UpdateProfileDto) {
    this.logger.log(`PATCH profile userId=${userId}`);

    const profileData: Record<string, unknown> = {};
    if (dto.birthdate !== undefined) profileData.birthdate = dto.birthdate;
    if (dto.zodiacSign !== undefined) profileData.zodiacSign = dto.zodiacSign;
    if (dto.gender !== undefined) profileData.gender = dto.gender;
    if (dto.avatarUrl !== undefined) profileData.avatarUrl = dto.avatarUrl;

    const prefsData: Record<string, unknown> = {};
    if (dto.pushTime !== undefined) prefsData.pushTime = dto.pushTime;
    if (dto.horoscopeEnabled !== undefined)
      prefsData.horoscopeEnabled = dto.horoscopeEnabled;
    if (dto.holidaysEnabled !== undefined)
      prefsData.holidaysEnabled = dto.holidaysEnabled;
    if (dto.timezone !== undefined) prefsData.timezone = dto.timezone;

    const [profile, prefs] = await Promise.all([
      Object.keys(profileData).length
        ? this.prisma.profile.upsert({
            where: { userId },
            update: profileData,
            create: { userId, ...profileData },
          })
        : this.prisma.profile.findUnique({ where: { userId } }),
      Object.keys(prefsData).length
        ? this.prisma.prefs.upsert({
            where: { userId },
            update: prefsData,
            create: { userId, ...prefsData },
          })
        : this.prisma.prefs.findUnique({ where: { userId } }),
    ]);

    return { profile, prefs };
  }

  /**
   * Смена настроения: обновляет Profile.currentMood + пишет в MoodLog.
   * Генерация support — задача Phase 2 (AI + support_phrases pool).
   */
  async patchMood(userId: string, mood: string) {
    this.logger.log(`PATCH mood userId=${userId}, mood=${mood}`);

    await this.prisma.profile.upsert({
      where: { userId },
      update: { currentMood: mood },
      create: { userId, currentMood: mood },
    });
    await this.prisma.moodLog.create({
      data: { userId, mood },
    });

    // TODO Phase 2: достать новую фразу из support_phrases по mood.
    return {
      mood,
      support: {
        text: 'Новая фраза поддержки появится после интеграции AI (Phase 2).',
      },
    };
  }
}
