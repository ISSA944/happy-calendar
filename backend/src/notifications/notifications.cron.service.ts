import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationCronService {
  private readonly logger = new Logger(NotificationCronService.name);

  /**
   * Заглушка CRON-задачи: выполняется раз в минуту
   */
  @Cron(CronExpression.EVERY_MINUTE)
  handleCron() {
    this.logger.log('Проверка: кому нужно отправить гороскоп прямо сейчас? (CRON stub)');
  }
}
