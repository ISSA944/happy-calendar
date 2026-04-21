import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { ProfileService, UpdateProfileDto } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

class PatchMoodDto {
  @IsString() @MaxLength(32)
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
  async patchProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.profileService.patch(user.sub, dto);
  }

  @Patch('mood')
  async patchMood(@CurrentUser() user: AuthUser, @Body() dto: PatchMoodDto) {
    return this.profileService.patchMood(user.sub, dto.mood);
  }
}
