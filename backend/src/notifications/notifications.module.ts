import { Module } from '@nestjs/common';
import { NotificationCronService } from './notifications.cron.service';
import { TodayModule } from '../today/today.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [TodayModule, PushModule],
  providers: [NotificationCronService],
})
export class NotificationsModule {}
