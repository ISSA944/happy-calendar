import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './current-user.decorator';

class LoginDto {
  @IsEmail()
  email!: string;
}

class RequestEmailChangeDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsBoolean()
  consents?: boolean;

  @IsOptional()
  @IsBoolean()
  marketing?: boolean;
}

class VerifyEmailChangeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/)
  code!: string;
}

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`POST /api/auth/register email=${dto.email}`);
    return this.authService.register(dto.email, dto.name, dto.consents, dto.marketing);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  async login(@Body() dto: LoginDto) {
    this.logger.log(`POST /api/auth/login email=${dto.email}`);
    return this.authService.login(dto.email);
  }

  @Post('verify-otp')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    this.logger.log(`POST /api/auth/verify-otp email=${dto.email}`);
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  @Post('email-change/request')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  async requestEmailChange(
    @CurrentUser() user: AuthUser,
    @Body() dto: RequestEmailChangeDto,
  ) {
    this.logger.log(`POST /api/auth/email-change/request userId=${user.sub}`);
    return this.authService.requestEmailChange(
      user.sub,
      dto.email,
      dto.consents,
    );
  }

  @Post('email-change/verify')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  async verifyEmailChange(
    @CurrentUser() user: AuthUser,
    @Body() dto: VerifyEmailChangeDto,
  ) {
    this.logger.log(`POST /api/auth/email-change/verify userId=${user.sub}`);
    return this.authService.verifyEmailChange(user.sub, dto.email, dto.code);
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
