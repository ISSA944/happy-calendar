import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai';
import { TodayModule } from '../today/today.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, AuthModule, AiModule, TodayModule, RedisModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
