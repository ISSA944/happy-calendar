import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma';
import { AiModule } from './ai';
import { FeedModule } from './feed';
import { MoodModule } from './mood';
import { BookmarksModule } from './bookmarks';
import { ProfileModule } from './profile';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    PrismaModule,
    AiModule,
    FeedModule,
    MoodModule,
    BookmarksModule,
    ProfileModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
