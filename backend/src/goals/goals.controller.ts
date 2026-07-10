import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ArrayUnique, IsArray, IsIn, IsString } from 'class-validator';
import { GoalsService } from './goals.service';
import { GOAL_IDS } from './goals.constant';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

class SetGoalsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(GOAL_IDS, { each: true, message: 'goal id must be one of calm|hear|food|move' })
  selected!: string[];
}

@Controller('api/goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async getGoals(@CurrentUser() user: AuthUser) {
    return this.goalsService.getGoalsForUser(user.sub);
  }

  @Patch()
  async setGoals(@CurrentUser() user: AuthUser, @Body() dto: SetGoalsDto) {
    return this.goalsService.setGoals(user.sub, dto.selected);
  }
}
