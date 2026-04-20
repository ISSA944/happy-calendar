import { Controller, Get, Query, Logger } from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller('api/feed')
export class FeedController {
  private readonly logger = new Logger(FeedController.name);

  constructor(private readonly feedService: FeedService) {}

  /**
   * GET /api/feed/today?userId=xxx
   *
   * Возвращает дневной пакет (гороскоп, праздник, поддержка).
   * Если в БД нет — генерирует через AI и кэширует.
   */
  @Get('today')
  async getTodayFeed(@Query('userId') userId: string) {
    this.logger.log(`GET /api/feed/today — userId=${userId}`);

    if (!userId) {
      return { error: 'userId is required', statusCode: 400 };
    }

    const feed = await this.feedService.getTodayFeed(userId);
    return { data: feed };
  }
}
