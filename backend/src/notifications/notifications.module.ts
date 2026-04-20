import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationCronService } from './notifications.cron.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationCronService],
})
export class NotificationsModule {}
