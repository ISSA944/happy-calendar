import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { IsIn } from 'class-validator';
import { PersonalCareService } from './personal-care.service';
import { GOAL_IDS } from '../goals';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

class CompletePersonalCareDto {
  @IsIn(GOAL_IDS, { message: 'goal id must be one of calm|hear|food|move' })
  goalId!: string;
}

@Controller('api/personal-care')
@UseGuards(JwtAuthGuard)
export class PersonalCareController {
  constructor(private readonly personalCareService: PersonalCareService) {}

  @Get('today')
  async today(@CurrentUser() user: AuthUser) {
    return this.personalCareService.getToday(user.sub);
  }

  @Post(':id/complete')
  @HttpCode(200)
  async complete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CompletePersonalCareDto,
  ) {
    return this.personalCareService.complete(user.sub, id, dto.goalId);
  }
}
