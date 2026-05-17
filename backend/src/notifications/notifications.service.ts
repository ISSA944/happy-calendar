import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async clearAll(userId: string): Promise<void> {
    await this.prisma.notification.deleteMany({ where: { userId } });
  }

  async list(userId: string) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    return this.prisma.notification.findMany({
      where: { userId, status: 'sent', sentAt: { gte: todayStart } },
      orderBy: { sentAt: 'desc' },
      take: 20,
      select: {
        id: true,
        sentAt: true,
        type: true,
        title: true,
        body: true,
        date: true,
        mood: true,
      },
    });
  }
}
