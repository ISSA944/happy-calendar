import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // CORS — разрешаем фронтенд (Vercel + localhost)
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://happy-calendar-vstp.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`🚀 Backend running on http://localhost:${port}`);
  logger.log(`📡 Endpoints:`);
  logger.log(`   GET  /api/feed/today?userId=xxx`);
  logger.log(`   POST /api/mood         { userId, mood }`);
  logger.log(`   POST /api/bookmarks    { userId, type, date, text, icon }`);
  logger.log(`   GET  /api/bookmarks?userId=xxx`);
  logger.log(`   DEL  /api/bookmarks/:id?userId=xxx`);
  logger.log(`   POST /api/profile      { userId, name, email, zodiacSign, ... }`);
  logger.log(`   GET  /api/profile?userId=xxx`);
}

bootstrap();
