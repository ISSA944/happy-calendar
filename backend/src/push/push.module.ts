import { Module } from '@nestjs/common';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { WebPushService } from './web-push.service';
import { PrismaModule } from '../prisma';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PushController],
  providers: [PushService, WebPushService],
  exports: [PushService, WebPushService],
})
export class PushModule {}
