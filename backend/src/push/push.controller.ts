import {
  Body,
  Controller,
  Delete,
  Post,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PushService } from './push.service';
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
}

@Controller('api/push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe')
  @HttpCode(200)
  async subscribe(@CurrentUser() user: AuthUser, @Body() dto: SubscribeDto) {
    return this.pushService.subscribe(user.sub, dto.fcm_token);
  }

  @Delete('unsubscribe')
  @HttpCode(200)
  async unsubscribe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UnsubscribeDto,
  ) {
    return this.pushService.unsubscribe(user.sub, dto.fcm_token);
  }
}
