import { Module } from '@nestjs/common';
import { NotificationCronService } from './notifications.cron.service';

@Module({
  providers: [NotificationCronService],
})
export class NotificationsModule {}
