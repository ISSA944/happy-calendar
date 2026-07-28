import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { HolidaysService, TONES, type Tone } from './holidays.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@Controller('api/holidays')
@UseGuards(JwtAuthGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get('today')
  async today(@CurrentUser() user: AuthUser) {
    return this.holidaysService.getTodayHolidays(user.sub);
  }

  @Get(':id/card')
  async card(@Param('id') id: string, @Query('tone') tone?: string) {
    const safeTone: Tone = TONES.includes(tone as Tone)
      ? (tone as Tone)
      : 'cute';
    return this.holidaysService.getCard(id, safeTone);
  }
}
