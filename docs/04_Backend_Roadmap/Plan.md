# Happy Calendar — Backend Development Roadmap

## Phase 1: Auth Module & DB Schema (DONE)
- NestJS bootstrap (Config, Throttler, Prisma, Firebase Admin)
- Prisma schema: все 10 моделей (User, Profile, Prefs, DailyFeed, Bookmark, MoodLog, Horoscope, Holiday, SupportPhrase, Prompt)
- Auth module: OTP generation, email sending (Resend/Mailgun), JWT (Access + Refresh tokens)
- Guards: JwtAuthGuard для защиты эндпоинтов
- API endpoints: `/api/auth/register`, `/api/auth/verify-otp`, `/api/auth/refresh`

## Phase 2: Redis Cache Layer & Profile API (IN PROGRESS — paused)
- Redis integration (ioredis / @nestjs/cache-manager)
- Cache service: get/set with TTL 24h, key pattern `${mood}_${zodiac}_${date}`
- Profile CRUD: `GET/PATCH /api/profile`
- Mood update endpoint: `PATCH /api/profile/mood` — returns only new support block
- Avatar upload: `POST /api/profile/avatar` → S3/R2 upload → URL в Profile

## Phase 3: AI Services Layer & Daily Pack
- AI Service (isolated module): принимает Context Payload (zodiac + date + mood + prompt)
- OpenAI/Anthropic integration (server-side only)
- Prompt management: CRUD для системных промптов (таблица Prompt)
- Daily Pack orchestration: `GET /api/today`
  - Check Redis cache → if miss → call AI → save to PG (Horoscope/SupportPhrase) → write to Redis
  - Compose response: horoscope + support + holiday
- Support phrase refresh: `POST /api/today/support/next`
- Horoscope sharing: 1 horoscope per zodiac sign per day, shared across all users of that sign

## Phase 4: Bookmarks, Push & CRON
- Bookmarks CRUD: `GET/POST/DELETE /api/bookmarks`
  - Immutable JSONB snapshots — payload frozen at bookmark time
- Push subscription: `POST /api/push/subscribe`, `DELETE /api/push/unsubscribe`
- FCM token management (multiple tokens per user in Prefs.fcm_tokens[])
- CRON scheduler: daily push notifications based on user's `push_time`
  - Firebase Cloud Messaging integration
  - Batch sending with error handling (token cleanup on failure)

## Phase 5: Production Deploy & Hardening
- Docker setup (Dockerfile + docker-compose: NestJS + PostgreSQL + Redis)
- Nginx reverse proxy config (SSL via Let's Encrypt)
- Environment management (.env.production)
- Health checks & monitoring endpoints
- Rate limiting tuning for production
- Database backups strategy
- Deploy to Ubuntu 22.04 LTS VPS
- Domain: `api.happy-calendar.app`
- Frontend deploy: Vercel (connect to repo)
