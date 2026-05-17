import { Controller, Delete, Get, HttpCode, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return this.notificationsService.list(user.sub);
  }

  @Delete()
  @HttpCode(204)
  async clearAll(@CurrentUser() user: AuthUser) {
    await this.notificationsService.clearAll(user.sub);
  }
}
