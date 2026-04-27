import { Controller, Get, Post, HttpCode, UseGuards } from '@nestjs/common';
import { TodayService } from './today.service';
import { AiService } from '../ai';
import { PrismaService } from '../prisma';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@Controller('api/today')
@UseGuards(JwtAuthGuard)
export class TodayController {
  constructor(
    private readonly todayService: TodayService,
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getToday(@CurrentUser() user: AuthUser) {
    return this.todayService.getTodayPack(user.sub);
  }

  @Post('support/next')
  @HttpCode(200)
  async nextSupport(@CurrentUser() user: AuthUser) {
    // "Другая фраза" — must always produce a fresh phrase, never cached.
    const profile = await this.prisma.profile.findUnique({ where: { userId: user.sub } });
    const mood = profile?.currentMood ?? 'Нормально';

    const { supportPhrase } = await this.ai.updateMoodSupport(user.sub, mood);
    await this.todayService.replaceSupportPhrase(user.sub, mood, supportPhrase);

    return { support: { text: supportPhrase } };
  }
}
