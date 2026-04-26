import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma';
import { AiModule } from './ai';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { TodayModule } from './today';
import { BookmarksModule } from './bookmarks';
import { ProfileModule } from './profile';
import { PushModule } from './push';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AiModule,
    RedisModule,
    AuthModule,
    TodayModule,
    BookmarksModule,
    ProfileModule,
    PushModule,
    FirebaseModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
