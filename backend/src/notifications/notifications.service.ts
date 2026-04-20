import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async saveToken(userId: string, token: string) {
    this.logger.log(`Saving FCM token for user=${userId}`);

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      this.logger.warn(`Profile not found for user=${userId}`);
      return;
    }

    // Добавляем токен, если его еще нет в массиве
    if (!profile.fcmTokens.includes(token)) {
      await this.prisma.profile.update({
        where: { userId },
        data: {
          fcmTokens: {
            push: token,
          },
        },
      });
      this.logger.log(`Token added successfully`);
    } else {
      this.logger.log(`Token already exists for user`);
    }

    return { success: true };
  }
}
