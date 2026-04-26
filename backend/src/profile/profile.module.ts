import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai';
import { TodayModule } from '../today/today.module';

@Module({
  imports: [PrismaModule, AuthModule, AiModule, TodayModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
