import { Controller, Get, Post, HttpCode, UseGuards } from '@nestjs/common';
import { TodayService } from './today.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@Controller('api/today')
@UseGuards(JwtAuthGuard)
export class TodayController {
  constructor(private readonly todayService: TodayService) {}

  @Get()
  async getToday(@CurrentUser() user: AuthUser) {
    return this.todayService.getTodayPack(user.sub);
  }

  @Post('support/next')
  @HttpCode(200)
  async nextSupport(@CurrentUser() user: AuthUser) {
    const pack = await this.todayService.getTodayPack(user.sub);
    return { support: pack.support };
  }
}
