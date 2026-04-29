import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { ProfileService, UpdateProfileDto } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

const VALID_MOODS = ['Спокойна', 'Нормально', 'Устала', 'Тревожна', 'Грустна', 'Воодушевлена'] as const;

class PatchMoodDto {
  @IsString()
  @MaxLength(32)
  @IsIn(VALID_MOODS, { message: 'mood must be one of the 6 canonical mood values' })
  mood!: string;
}

@Controller('api/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: AuthUser) {
    return this.profileService.getFullProfile(user.sub);
  }

  @Patch()
  async patchProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.patch(user.sub, dto);
  }

  @Patch('mood')
  async patchMood(@CurrentUser() user: AuthUser, @Body() dto: PatchMoodDto) {
    return this.profileService.patchMood(user.sub, dto.mood);
  }
}
