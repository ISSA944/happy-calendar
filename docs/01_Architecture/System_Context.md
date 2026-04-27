# YoYoJoy Day — System Context & Architecture (L1)

## 1. Role & Product Vision
Ты — Senior Fullstack Developer / Lead Backend Architect.
**Продукт:** PWA-компаньон к бумажному календарю. 
**Ценность:** Юзер сканирует QR, проходит онбординг и ежедневно получает персонализированный контент: гороскоп, фразу поддержки и карточку праздника.
**Дизайн-система:** Zen-Emerald (#006a65, #2FA7A0, #fcf9f4). Mobile-first, без горизонтального скролла.
**Source (UI/UX):** https://stitch.withgoogle.com/projects/15233978351152499747

## 2. User Flow & Core Mechanics
- **Onboarding:** QR → Welcome → Регистрация (Email) → OTP → Разрешение на Push → Настройка профиля (дата рождения, знак, пол) → Home.
- **Daily Loop:** Push-уведомление → Открытие Home → Чтение/Сохранение в закладки.
- **Mood Mechanic (Ключевая фича):** 6 настроений. При смене настроения на главной странице (через bottom sheet) обновляется **ТОЛЬКО** блок поддержки (текст + баннер). Гороскоп и праздник остаются неизменными (экономия LLM токенов).

## 3. Tech Stack & Infrastructure
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Zustand + Framer Motion + Vite PWA Plugin.
- **Backend:** Node.js + NestJS 11 + Prisma ORM 6.
- **Databases:** PostgreSQL (Primary DB) + Redis (AI Cache, TTL 24h).
- **Integrations:** Firebase Cloud Messaging (FCM) для Push, Resend/Mailgun для OTP.
- **Media Storage:** CDN / S3-compatible (Cloudflare R2 / MinIO).
- **AI Provider:** OpenAI / Anthropic (строго Server-Side вызовы).
- **Deployment:** Vercel (Front) + Ubuntu 22.04 LTS VPS (Back: Docker, Nginx, Let's Encrypt). Домен API: `api.happy-calendar.app`.

## 4. Architecture Design (4 Layers)
1. **Client (PWA):** React SPA. Отвечает за UI, роутинг, Service Worker (offline cache последнего daily pack), IndexedDB (snapshot закладок) и PWA install flow.
2. **API Gateway (NestJS):** Единая точка входа. 
   - `Auth`: OTP → JWT (Access/Refresh).
   - `Profile`: CRUD профиля и настроек пользователя.
   - `Daily Pack`: Оркестрация сбора контента на день.
   - `Bookmarks`: CRUD пользовательских сохранений.
   - `Push Scheduler`: CRON-задачи для рассылки FCM.
3. **AI Services Layer (Isolated):** Изолирован от клиента. Принимает Context Payload (zodiac + date + mood + prompt). Возвращает структурированный JSON. НЕ работает с БД напрямую, НЕ генерирует медиа.
4. **Data Layer:** PostgreSQL (хранение стейта) + Redis (быстрая отдача сгенерированных паков).

## 5. Data Models (PostgreSQL / Prisma)
*Архитектурный принцип (AI Token Optimization):* `daily_feed` выступает как join-таблица. Гороскопы генерируются 1 раз в день для каждого знака зодиака и переиспользуются (расшариваются) между всеми юзерами этого знака.

| Model | Attributes | Relations |
|---|---|---|
| **User** | `id`, `email`, `name`, `created_at` | 1:1 to Profile/Prefs, 1:N to Feed/Bookmarks |
| **Profile** | `user_id`, `birthdate`, `zodiac_sign`, `gender`, `avatar_url`, `current_mood` | Belongs to User |
| **Prefs** | `user_id`, `push_time`, `fcm_tokens` (String[]), `horoscope_enabled`, `holidays_enabled` | Belongs to User |
| **DailyFeed** | `id`, `user_id`, `date`, `horoscope_id`, `support_id`, `holiday_id` | Links User to daily content |
| **Bookmark** | `id`, `user_id`, `type`, `payload` (JSONB snapshot), `created_at` | Belongs to User |
| **MoodLog** | `id`, `user_id`, `mood`, `changed_at` | Audit log |
| **Horoscope** | `id`, `date`, `zodiac_sign`, `main`, `advice`, `moon`, `aspect` | Shared across users |
| **Holiday** | `id`, `date`, `title`, `description` | Shared across users |
| **SupportPhrase**| `id`, `mood`, `text`, `used_count` | Shared / Cached |
| **Prompt** | `id`, `type`, `template` | System configuration |

## 6. API Contract (REST)
*Auth Required:* Все эндпоинты (кроме `/api/auth/*`) требуют `Authorization: Bearer <jwt>`.

**Auth & Security:**
- `POST /api/auth/register` -> `{ email, name?, consents }`
- `POST /api/auth/verify-otp` -> `{ email, code }` → Returns `{ accessToken, refreshToken }`
- `POST /api/auth/refresh` -> `{ refresh_token }`

**User & Profile:**
- `GET /api/profile`
- `PATCH /api/profile` -> `{ birthdate?, push_time? }`
- `PATCH /api/profile/mood` -> `{ mood }` → Возвращает только новый support block.
- `POST /api/profile/avatar` -> `multipart/form-data`

**Content & Feed:**
- `GET /api/today` -> Возвращает полный скомпонованный Daily Pack.
- `POST /api/today/support/next` -> Генерирует/достает следующую фразу поддержки.

**Bookmarks & Push:**
- `GET /api/bookmarks?type=horoscope|support`
- `POST /api/bookmarks` -> `{ type, payload: {} }`
- `DELETE /api/bookmarks/:id`
- `POST /api/push/subscribe` -> `{ fcm_token }`
- `DELETE /api/push/unsubscribe`

## 7. CRITICAL GUARDRAILS (Strict Rules)
1. **Server-Side AI ONLY:** LLM-ключи (`OPENAI_API_KEY`, etc.) строго в `.env` бэкенда. PWA ничего не знает об ИИ.
2. **Partial Updates:** При смене настроения (`mood`) пересобирается/запрашивается ТОЛЬКО блок поддержки. Полная перегенерация `Daily Pack` запрещена!
3. **Immutable Bookmarks:** Закладки сохраняются как JSONB `snapshot` на момент нажатия. Если исходный текст в базе изменится, у юзера в закладках должен остаться старый текст.
4. **Dumb Client Push:** PWA отвечает только за получение `fcm_token` и передачу его на бэк. Вся логика расписания (`push_time`) и триггеры находятся строго на сервере (CRON).
5. **Media Isolation:** Никакого хранения картинок/аватарок в Postgres (Base64) или файловой системе сервера. Строго CDN/S3 ссылки.
6. **AI Cache Policy (Redis):** Кэширование запросов обязательно. Ключ: `${mood}_${zodiac}_${date}`. TTL: 24 часа. Схема: Cache Miss → LLM API → Сохранение в PG (Horoscope/Support) → Запись в Redis.

## 8. Development & CLI
**Frontend (`/`)**
- `npm run dev` (Vite dev server: 5173)
- `npm run build` (Prod build)

**Backend (`/backend`)**
- `npm run start:dev` (NestJS watch)
- `npx prisma migrate dev --name <slug>` (Dev migration)
- `npx prisma migrate deploy` (Prod migration)
- `npx prisma generate` (Update TS client)

## 9. Current Status (As of 2026-04-21)
- **DONE:** Фронт-MVP (UI, PWA offline, animations, state). Бэкенд-каркас (NestJS, Zod, Throttler, Firebase Admin, Mocks). Базовые модели Prisma.
- **IN PROGRESS (Current Phase):** Внедрение Auth (OTP + JWT + Guards) & настройка Redis (Cache Layer).
- **PENDING:** Подключение реального LLM, рассылка FCM Push через CRON, S3-интеграция, Prod Deploy.
