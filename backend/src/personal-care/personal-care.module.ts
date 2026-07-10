import { Module } from '@nestjs/common';
import { PersonalCareController } from './personal-care.controller';
import { PersonalCareService } from './personal-care.service';
import { PrismaModule } from '../prisma';
import { AuthModule } from '../auth/auth.module';
import { GoalsModule } from '../goals';
import { PushModule } from '../push';

@Module({
  imports: [PrismaModule, AuthModule, GoalsModule, PushModule],
  controllers: [PersonalCareController],
  providers: [PersonalCareService],
  exports: [PersonalCareService],
})
export class PersonalCareModule {}
