import { Module } from '@nestjs/common';
import { NotificationCronService } from './notifications.cron.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TodayModule } from '../today/today.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [TodayModule, PushModule],
  controllers: [NotificationsController],
  providers: [NotificationCronService, NotificationsService],
})
export class NotificationsModule {}
