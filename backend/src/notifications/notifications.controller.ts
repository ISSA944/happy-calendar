import { Controller, Post, Body, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

class SaveTokenDto {
  userId!: string;
  token!: string;
}

@Controller('api/notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * POST /api/notifications/token
   * Body: { userId: string, token: string }
   */
  @Post('token')
  async saveToken(@Body() dto: SaveTokenDto) {
    this.logger.log(`POST /api/notifications/token — userId=${dto.userId}`);

    if (!dto.userId || !dto.token) {
      return { error: 'userId and token are required', statusCode: 400 };
    }

    const result = await this.notificationsService.saveToken(dto.userId, dto.token);
    return { data: result };
  }
}
