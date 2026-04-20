import { Module } from '@nestjs/common';
import { MoodController } from './mood.controller';
import { MoodService } from './mood.service';
import { AiModule } from '../ai';

@Module({
  imports: [AiModule],
  controllers: [MoodController],
  providers: [MoodService],
})
export class MoodModule {}
