import { Module } from '@nestjs/common';
import { TodayController } from './today.controller';
import { TodayService } from './today.service';
import { PrismaModule } from '../prisma';
import { AiModule } from '../ai';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AiModule, AuthModule],
  controllers: [TodayController],
  providers: [TodayService],
})
export class TodayModule {}
