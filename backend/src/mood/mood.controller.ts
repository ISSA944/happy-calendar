import { Controller, Post, Body, Logger } from '@nestjs/common';
import { MoodService } from './mood.service';

class UpdateMoodDto {
  userId!: string;
  mood!: string;
}

@Controller('api/mood')
export class MoodController {
  private readonly logger = new Logger(MoodController.name);

  constructor(private readonly moodService: MoodService) {}

  /**
   * POST /api/mood
   * Body: { userId: string, mood: string }
   *
   * Обновляет настроение, перегенерирует фразу поддержки через AI.
   */
  @Post()
  async updateMood(@Body() dto: UpdateMoodDto) {
    this.logger.log(`POST /api/mood — userId=${dto.userId}, mood=${dto.mood}`);

    if (!dto.userId || !dto.mood) {
      return { error: 'userId and mood are required', statusCode: 400 };
    }

    const result = await this.moodService.updateMood(dto.userId, dto.mood);
    return { data: result };
  }
}
