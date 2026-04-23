import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './current-user.decorator';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`POST /api/auth/register email=${dto.email}`);
    return this.authService.register(dto.email, dto.name, dto.consents);
  }

  @Post('verify-otp')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    this.logger.log(`POST /api/auth/verify-otp email=${dto.email}`);
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: AuthUser) {
    await this.authService.logout(user.sub);
  }
}
