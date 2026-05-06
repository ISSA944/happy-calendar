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
import { WebPushService } from './web-push.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

class SubscribeDto {
  @IsString()
  @MaxLength(4096)
  fcm_token!: string;
}

class UnsubscribeDto {
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  fcm_token?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  endpoint?: string;
}

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

class WebSubscribeDto {
  @IsObject()
  subscription!: BrowserPushSubscriptionDto;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  user_agent?: string;
}

@Controller('api/push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(
    private readonly pushService: PushService,
    private readonly webPushService: WebPushService,
  ) {}

  @Post('subscribe')
  @HttpCode(200)
  async subscribe(@CurrentUser() user: AuthUser, @Body() dto: SubscribeDto) {
    return this.pushService.subscribe(user.sub, dto.fcm_token);
  }

  @Post('test')
  @HttpCode(200)
  async testPush(@CurrentUser() user: AuthUser) {
    return this.pushService.sendTestPush(user.sub);
  }

  @Post('web-subscribe')
  @HttpCode(200)
  async webSubscribe(@CurrentUser() user: AuthUser, @Body() dto: WebSubscribeDto) {
    return this.webPushService.subscribe(user.sub, dto.subscription, dto.user_agent);
  }

  @Delete('unsubscribe')
  @HttpCode(200)
  async unsubscribe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UnsubscribeDto,
  ) {
    const fcm = await this.pushService.unsubscribe(user.sub, dto.fcm_token);
    const web = await this.webPushService.unsubscribe(user.sub, dto.endpoint);
    return { ...fcm, web };
  }
}
