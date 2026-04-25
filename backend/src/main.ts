import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const allowed =
        origin === 'http://localhost:5173' ||
        origin === 'http://localhost:4173' ||
        // Any Vercel preview / prod deployment owned by this project
        /^https:\/\/happy-calendar[a-z0-9-]*\.vercel\.app$/.test(origin) ||
        // Any ngrok/cloudflare tunnel used for local-backend exposure
        /^https:\/\/[a-z0-9-]+\.(ngrok-free\.app|ngrok\.io|trycloudflare\.com)$/.test(origin);

      if (allowed) return callback(null, true);

      callback(new Error(`CORS: origin '${origin}' not allowed`));
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
