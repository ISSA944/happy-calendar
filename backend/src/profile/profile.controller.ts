import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import { ProfileService, type UpdateProfileDto } from './profile.service';

@Controller('api/profile')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async updateProfile(@Body() dto: UpdateProfileDto) {
    this.logger.log(`POST /api/profile — userId=${dto.userId}`);
    
    if (!dto.userId) {
      return { error: 'userId is required', statusCode: 400 };
    }

    const result = await this.profileService.upsertProfile(dto);
    return { data: result };
  }

  @Get()
  async getProfile(@Query('userId') userId: string) {
    this.logger.log(`GET /api/profile — userId=${userId}`);
    
    if (!userId) {
      return { error: 'userId is required', statusCode: 400 };
    }

    const result = await this.profileService.getProfile(userId);
    return { data: result };
  }
}
