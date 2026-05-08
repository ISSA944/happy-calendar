import {
  Body,
  Controller,
  Delete,
  Post,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

class BrowserPushSubscriptionDto {
  @IsString()
  @MaxLength(4096)
  endpoint!: string;

  @IsObject()
  keys!: {
    p256dh: string;
    auth: string;
  };
}

class SubscribeDto {
  @IsObject()
  subscription!: BrowserPushSubscriptionDto;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  user_agent?: string;
}

class UnsubscribeDto {
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  endpoint?: string;
}

@Controller('api/push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(
    private readonly pushService: PushService,
  ) {}

  @Post('subscribe')
  @HttpCode(200)
  async subscribe(@CurrentUser() user: AuthUser, @Body() dto: SubscribeDto) {
    return this.pushService.subscribe(user.sub, dto.subscription, dto.user_agent);
  }

  @Post('test')
  @HttpCode(200)
  async testPush(@CurrentUser() user: AuthUser) {
    return this.pushService.sendTestPush(user.sub);
  }

  @Delete('unsubscribe')
  @HttpCode(200)
  async unsubscribe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UnsubscribeDto,
  ) {
    return this.pushService.unsubscribe(user.sub, dto.endpoint);
  }
}
