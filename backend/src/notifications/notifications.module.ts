import { Module } from '@nestjs/common'; 
import { NotificationCronService } from './notifications.cron.service';
import { TodayModule } from '../today/today.module'; // <--- ИМПОРТ

@Module({
  imports: [TodayModule], // <--- ДОБАВИЛИ ЭТО
  providers: [NotificationCronService],
})
export class NotificationsModule {}