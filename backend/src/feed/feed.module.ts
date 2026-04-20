import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { AiModule } from '../ai';

@Module({
  imports: [AiModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
