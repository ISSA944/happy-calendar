import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const allowedOrigins = [
    'https://yoyojoy.online',
    'https://www.yoyojoy.online',
    /^https:\/\/[\w-]+\.vercel\.app$/,   // любые preview-деплои Vercel
    'http://localhost:5173',
    'http://192.168.100.17:5173',         // локальная сеть для тестов
  ];

  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      if (!origin) return cb(null, true);
      const ok = allowedOrigins.some(o =>
        typeof o === 'string' ? o === origin : o.test(origin),
      );
      cb(ok ? null : new Error(`CORS blocked: ${origin}`), ok);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
  logger.log(`Endpoints:`);
  logger.log(`  POST   /api/auth/register`);
  logger.log(`  POST   /api/auth/verify-otp`);
  logger.log(`  POST   /api/auth/refresh`);
  logger.log(`  POST   /api/auth/logout`);
  logger.log(`  GET    /api/profile`);
  logger.log(`  PATCH  /api/profile`);
  logger.log(`  PATCH  /api/profile/mood`);
  logger.log(`  GET    /api/today`);
  logger.log(`  POST   /api/today/support/next`);
  logger.log(`  GET    /api/bookmarks?type=...`);
  logger.log(`  POST   /api/bookmarks`);
  logger.log(`  DELETE /api/bookmarks/:id`);
  logger.log(`  POST   /api/push/subscribe`);
  logger.log(`  DELETE /api/push/unsubscribe`);
}

void bootstrap();
