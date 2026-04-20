import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

export interface UpdateProfileDto {
  userId: string;
  name?: string;
  email?: string;
  zodiacSign?: string;
  gender?: string;
  birthDate?: string;
  horoscopeTime?: string;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertProfile(dto: UpdateProfileDto) {
    this.logger.log(`Upserting profile for user=${dto.userId}`);

    // Create or update user
    const user = await this.prisma.user.upsert({
      where: { id: dto.userId },
      update: {
        name: dto.name,
        email: dto.email,
      },
      create: {
        id: dto.userId,
        name: dto.name,
        email: dto.email,
      },
    });

    // Create or update profile
    const profile = await this.prisma.profile.upsert({
      where: { userId: dto.userId },
      update: {
        zodiacSign: dto.zodiacSign,
        gender: dto.gender,
        birthDate: dto.birthDate,
        horoscopeTime: dto.horoscopeTime,
      },
      create: {
        userId: dto.userId,
        zodiacSign: dto.zodiacSign,
        gender: dto.gender,
        birthDate: dto.birthDate,
        horoscopeTime: dto.horoscopeTime || "09:00",
      },
    });

    return { user, profile };
  }

  async getProfile(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });
  }
}
