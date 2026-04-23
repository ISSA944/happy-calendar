import { Module } from '@nestjs/common';
import { NotificationCronService } from './notifications.cron.service';
import { PrismaModule } from '../prisma';
import { TodayModule } from '../today';

@Module({
  imports: [PrismaModule, TodayModule],
  providers: [NotificationCronService],
})
export class NotificationsModule {}
