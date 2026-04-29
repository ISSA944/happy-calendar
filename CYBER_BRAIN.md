# 🧠 CYBER_BRAIN.md — YoYoJoy Day: System Architecture & Knowledge Base

> **Версия:** 1.0 | **Дата:** 2026-04-29 | **Фаза:** Phase 4 Complete (Production Deployed)
> Этот документ — «Библия» проекта. Любой Senior-разработчик должен понять систему за 15 минут.

---

## 🚀 1. PRODUCT OVERVIEW

**YoYoJoy Day** — PWA-компаньон к бумажному ежедневнику. Пользователь сканирует QR-код на физическом календаре, проходит онбординг и ежедневно получает персонализированный «Daily Pack».

### Ценностное предложение
| Что получает пользователь | Как это работает |
|---|---|
| 🔮 Персональный гороскоп дня | AI генерирует по знаку зодиака, кэшируется на 24ч |
| 🎉 Праздник или wellness-тема | Локальный справочник 130+ дат, никогда не пустой |
| 💬 Фраза поддержки по настроению | 6 настроений → AI или fallback-словарь |
| 🔔 Push-уведомление в заданное время | CRON каждую минуту проверяет по UTC |

### Onboarding Flow
```
QR → Welcome → Register (Email) → OTP (4 цифры) → Push Permissions → Profile Setup → Home
```

### Daily Loop
```
Push (FCM, по расписанию) → Открытие PWA → Чтение контента → Закладки / Смена настроения
```

### Mood Mechanic (Hybrid Partial Update)
При смене настроения **обновляется только блок поддержки**. Гороскоп и праздник остаются — экономия LLM-токенов × 5.

---

## 🛠 2. TECH STACK MATRIX

### Frontend

| Технология | Версия | Зачем выбрали |
|---|---|---|
| **React** | 19 | Concurrent rendering, `startTransition` для анимаций без лагов |
| **TypeScript** | 5.x | Строгая типизация API-контрактов и Zustand-стора |
| **Vite** | 6.x | Быстрая сборка, нативный ESM, встроенный HMR |
| **Tailwind CSS** | 3.x | Utility-first, `landscape:` модификатор для мобильного landscape-режима |
| **Zustand** | 5.x | Минималистичный стор, persist middleware для оффлайн-состояния |
| **Framer Motion** | 11.x | Аппаратно-ускоренные анимации (opacity, transform), iOS-физика |
| **Vite PWA Plugin** | 1.x | Service Worker (Workbox NetworkFirst), Web App Manifest, A2HS |
| **Axios** | 1.x | HTTP-клиент с interceptors для JWT auto-refresh |
| **React Router** | 6.x | Клиентский роутинг, lazy-loading auth-страниц |

> ⚠️ **ПРАВИЛО:** Адаптация под landscape — **только** через Tailwind `landscape:` модификатор. Никаких `md:` или `lg:`. Десктопы получают мобильный интерфейс по центру.

### Backend

| Технология | Версия | Зачем выбрали |
|---|---|---|
| **Node.js** | 20 LTS | Долгосрочная поддержка, нативный `Intl` для таймзон |
| **NestJS** | 11 | Модульная архитектура, DI-контейнер, Guards, Decorators |
| **Prisma ORM** | 6 | Типобезопасные запросы, авто-миграции, Prisma Studio |
| **class-validator** | 0.14 | DTO-валидация (`@IsIn`, `@IsEmail`, `@Matches`) на уровне контроллеров |
| **@nestjs/throttler** | 6 | Rate-limiting: 10 запросов / 60 сек глобально |
| **bcrypt** | 5 | Хэширование OTP-кодов и refresh-токенов (10 раундов) |
| **jsonwebtoken (via @nestjs/jwt)** | — | JWT access (15 мин) + refresh (30 дней) с ротацией |

### Базы данных

| БД | Версия | Роль | TTL |
|---|---|---|---|
| **PostgreSQL** | 15 | Primary: все модели (User, DailyFeed, Bookmark...) | Постоянно |
| **Redis** | 7 | AI Cache: pack по ключу `zodiac:mood:date` | 24 часа |

### Интеграции

| Сервис | Зачем | Где используется |
|---|---|---|
| **OpenAI** | Генерация гороскопа + фраз поддержки | `backend/src/ai/ai.service.ts` |
| **Firebase Admin SDK** | Отправка FCM Push | `backend/src/firebase/firebase.service.ts` |
| **Firebase JS SDK** | Получение FCM-токена на клиенте | `src/lib/firebase.ts` |
| **Gmail SMTP / Resend** | Отправка OTP-кодов | `backend/src/auth/auth.service.ts` |
| **Nodemailer** | SMTP-транспорт для Gmail App Password | `backend/src/auth/auth.service.ts` |

### Инфраструктура

| Компонент | Где | Что делает |
|---|---|---|
| **Vercel** | Frontend | Auto-deploy из GitHub `main`, Edge CDN, `VITE_API_BASE_URL` env |
| **Timeweb VPS** | `157.22.198.107` | Ubuntu 22.04, 2vCPU, 2GB RAM |
| **Docker Compose** | VPS `/root/yoyojoy-backend/` | 3 контейнера: PostgreSQL, Redis, API |
| **Nginx** | VPS (pending) | Reverse proxy + SSL (после покупки домена) |
| **Let's Encrypt** | VPS (pending) | TLS-сертификат (после покупки домена) |

---

## 📁 3. DIRECTORY & FILE MAP

```
happy-calendar/
│
├── 📦 src/                          # PWA Frontend (React + Vite)
│   ├── App.tsx                      # Роутер + AppLayout + RootGuard
│   ├── main.tsx                     # Vite entry, React.StrictMode
│   │
│   ├── 📄 pages/                    # Полноэкранные страницы
│   │   ├── WelcomePage.tsx          # Onboarding: hero + CTA "Начать"
│   │   ├── RegistrationPage.tsx     # Email + имя + согласие ПД
│   │   ├── OtpPage.tsx              # 4 OTP-бокса с авто-переходом
│   │   ├── NotificationsPage.tsx    # Настройка времени push + toggles
│   │   ├── ProfileSetupPage.tsx     # Дата рождения → знак зодиака + пол
│   │   ├── HomePage.tsx             # Главная: гороскоп, праздник, поддержка
│   │   ├── BookmarksPage.tsx        # Список сохранённых карточек
│   │   ├── SettingsPage.tsx         # Профиль + reset + управление аккаунтом
│   │   ├── NotificationsListPage.tsx# История отправленных пушей
│   │   └── PrivacyPolicyPage.tsx    # Политика конфиденциальности
│   │
│   ├── 🧩 features/                 # Фичи (UI-компоненты с логикой)
│   │   ├── auth/
│   │   │   ├── CalendarSheet.tsx    # BottomSheet с выбором даты рождения
│   │   │   └── TimePickerSheet.tsx  # BottomSheet с барабаном HH:MM (no-swipe)
│   │   └── mood/
│   │       └── MoodSheet.tsx        # BottomSheet: 6 настроений (Стitch-дизайн)
│   │
│   ├── 🔧 components/               # Переиспользуемые UI-компоненты
│   │   ├── ui/
│   │   │   └── BottomSheet.tsx      # Базовый BottomSheet с анимацией iOS-физики
│   │   └── BottomNav.tsx            # Нижняя навигация (Home/Bookmarks/Settings)
│   │
│   ├── 🪝 hooks/                    # Кастомные React-хуки
│   │   ├── useFirebasePush.ts       # Запрос разрешения + sync FCM-токена на бэк
│   │   └── usePWAInstall.ts         # beforeinstallprompt + iOS standalone-detect
│   │
│   ├── 🏪 store/                    # Zustand state management
│   │   └── app.store.ts             # Единый стор: настроение, dailyPack, закладки,
│   │                                # профиль, настройки + persist в localStorage
│   │
│   ├── 🌐 api/
│   │   └── client.ts                # Axios + JWT auto-refresh interceptor (single-flight)
│   │
│   ├── 🔐 auth/
│   │   └── token-storage.ts         # getAccessToken / setAuthTokens / clearAuthTokens
│   │
│   ├── 🛠 lib/
│   │   ├── firebase.ts              # Firebase JS SDK init + getFirebaseMessagingToken
│   │   └── time.ts                  # localTimeToUtc (HH:MM → UTC для бэка)
│   │
│   └── 🧰 utils/
│       └── validation.ts            # isValidEmail (regex)
│
├── 📦 backend/src/                  # API Backend (NestJS)
│   ├── main.ts                      # Bootstrap: Nest + CORS + ValidationPipe + Swagger
│   ├── app.module.ts                # Корневой модуль: все imports, ThrottlerGuard
│   │
│   ├── 🔒 auth/                     # Аутентификация
│   │   ├── auth.service.ts          # register() OTP, verifyOtp(), refresh(), logout()
│   │   ├── auth.controller.ts       # POST /auth/register, /verify-otp, /refresh, /logout
│   │   ├── jwt-auth.guard.ts        # JwtAuthGuard — защищает приватные эндпоинты
│   │   └── current-user.decorator.ts# @CurrentUser() → { sub, email } из JWT payload
│   │
│   ├── 🧠 ai/                       # AI-интеграция
│   │   ├── ai.service.ts            # generateDailyPack() + updateMoodSupport() + fallback
│   │   └── holidays.data.ts         # 130+ праздников + resolveHoliday() (wellness rotation)
│   │
│   ├── 📅 today/                    # Основная бизнес-логика Daily Pack
│   │   ├── today.service.ts         # getTodayPack() (3-level cache) + replaceSupportPhrase()
│   │   └── today.controller.ts      # GET /today, POST /today/support/next
│   │
│   ├── 👤 profile/                  # Профиль пользователя
│   │   ├── profile.service.ts       # patch() (birthdate/zodiac/gender), patchMood()
│   │   └── profile.controller.ts    # GET /profile, PATCH /profile, PATCH /profile/mood
│   │
│   ├── 🔖 bookmarks/                # Закладки (иммутабельные снапшоты)
│   │   ├── bookmarks.service.ts     # create() / findAll() / remove()
│   │   └── bookmarks.controller.ts  # GET/POST/DELETE /bookmarks
│   │
│   ├── 🔔 push/                     # FCM-подписки устройств
│   │   ├── push.service.ts          # subscribe() (atomic array_append), unsubscribe()
│   │   └── push.controller.ts       # POST /push/subscribe, /push/test, DELETE /push
│   │
│   ├── ⏰ notifications/             # Push-рассылка по расписанию
│   │   └── notifications.cron.service.ts  # @Cron(EVERY_MINUTE) → Firebase Admin SDK
│   │
│   ├── 🔥 firebase/
│   │   └── firebase.service.ts      # Admin SDK init + sendPushNotification()
│   │
│   ├── 🗃 prisma/
│   │   └── prisma.service.ts        # PrismaClient singleton + onModuleInit connect
│   │
│   ├── ⚡ redis/
│   │   └── redis.service.ts         # ioredis get/set/del обёртка
│   │
│   └── ⚙️ config/
│       └── env.validation.ts        # Joi-схема для валидации .env при старте
│
├── backend/prisma/
│   ├── schema.prisma                # Вся схема БД
│   └── migrations/                  # SQL-миграции (prisma migrate deploy на VPS)
│
├── backend/docker-compose.prod.yml  # Production: postgres + redis + api
├── backend/Dockerfile               # Multi-stage: builder → runner (node:20-alpine)
├── backend/.env.prod                # Боевые секреты на VPS (НЕ в git)
│
├── public/
│   ├── firebase-messaging-sw.js     # Service Worker для FCM background push
│   └── manifest.webmanifest         # PWA manifest (icons, theme, display: standalone)
│
├── CLAUDE.md                        # Правила и архитектурные guardrails проекта
├── CYBER_BRAIN.md                   # Этот документ ← ты здесь
└── vite.config.ts                   # Vite + PWA plugin + path aliases
```

---

## 🧠 4. CORE MECHANICS & DATA FLOW

### 4.1 JWT Auth Flow

```
Клиент                          Бэкенд
  │                               │
  ├─ POST /auth/register ────────►│  upsert User, генерируем OTP-код,
  │  { email, name }              │  bcrypt.hash(code) → User.otpHash
  │                               │  sendOtpEmail(email, code)
  │◄─ { ok: true } ──────────────┤
  │                               │
  ├─ POST /auth/verify-otp ──────►│  bcrypt.compare(code, otpHash)
  │  { email, code }              │  → чистим otpHash (одноразовость)
  │                               │  → создаём Profile + Prefs (upsert)
  │                               │  → issueTokens(): access(15m)+refresh(30d)
  │                               │  → bcrypt.hash(refreshToken) → User.refreshTokenHash
  │◄─ { accessToken, refreshToken}┤
  │                               │
  │  [После 15 минут]             │
  ├─ GET /today ─────────────────►│  JwtAuthGuard: jwt.verify fails → 401
  │◄─ 401 ────────────────────────┤
  │                               │
  │  [Interceptor в apiClient.ts] │
  ├─ POST /auth/refresh ─────────►│  bcrypt.compare(refreshToken, hash)
  │  { refresh_token }            │  → issueTokens() → ротация: новый хэш
  │◄─ { accessToken, refreshToken}┤
  │                               │
  ├─ GET /today (retry) ─────────►│  ✅ 200 OK
```

> **Single-flight pattern:** Если несколько запросов одновременно получили 401, все они ждут **одного** `refreshPromise`, а не отправляют N параллельных refresh-запросов. Реализовано в `src/api/client.ts`.

---

### 4.2 Daily Pack: трёхуровневое кэширование

```
GET /api/today (userId)
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ LEVEL 1: PostgreSQL DailyFeed (per user per day)    │
│ WHERE userId = ? AND date = "DD.MM" (user timezone) │
└───────────────┬─────────────────────────────────────┘
                │ HIT → return cached pack
                │ MISS ↓
┌─────────────────────────────────────────────────────┐
│ LEVEL 2: Redis (shared, TTL 24h)                    │
│ KEY: pack:{zodiacSign}:{mood}:{date}                │
│ Один ключ на ВСЕХ пользователей с одинаковым        │
│ знаком + настроением → экономия AI-вызовов          │
└───────────────┬─────────────────────────────────────┘
                │ HIT → перейти к Level 3 WRITE
                │ MISS ↓
┌─────────────────────────────────────────────────────┐
│ LEVEL 3: OpenAI API (или mock-fallback)             │
│ Structured Outputs: DAILY_PACK_SCHEMA (strict:true) │
│ temperature: 0.3 (предсказуемость гороскопа)        │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
Сохранить в Redis (24h) → Upsert Horoscope + SupportPhrase + Holiday
→ Создать DailyFeed (userId ↔ ref-записи) → return response
```

> **Ключевая оптимизация:** Если 100 пользователей — Скорпионы с настроением «Спокойна», в день будет **1 AI-вызов** (Redis HIT для остальных 99). Это и есть смысл shared ref-таблиц.

---

### 4.3 Hybrid Partial Update (смена настроения)

```
PATCH /api/profile/mood { mood: "Тревожна" }
              │
              ▼
Параллельно (Promise.all):
  1. ai.updateMoodSupport(userId, "Тревожна")    ← лёгкий вызов (только supportPhrase)
  2. Profile.upsert({ currentMood: "Тревожна" })
  3. MoodLog.create({ mood: "Тревожна" })         ← аудит-лог

              │ supportPhrase получен
              ▼
  4. SupportPhrase.create({ mood, text })
  5. DailyFeed.updateMany({ date: today })         ← updateMany (не upsert!)
     SET supportPhraseId = newPhrase.id            ← только support меняется
     WHERE userId = ? AND date = ?                 ← гороскоп нетронут

              ▼
return { currentMood, support: { text, mood } }
```

> **Почему `updateMany`, а не `upsert`?** Если пользователь меняет настроение до первого открытия главной страницы (нет DailyFeed), `upsert` создал бы неполную запись без `horoscopeId`. `updateMany` тихо пропускает, если записи нет — `getTodayPack` создаст её полной при первом заходе.

---

### 4.4 AI Fallback Policy

```typescript
// ai.service.ts — generateDailyPack()
if (this.openai) {
  try {
    // → OpenAI Structured Outputs
  } catch (err) {
    this.logger.error('LLM failed — using fallback')
    // Падение сюда: timeout, rate limit, нет ключа, etc.
  }
}

// Всегда доступен — приложение НИКОГДА не падает из-за AI:
return {
  horoscope:     this.horoscopes[zodiacSign] ?? this.horoscopes['Овен ♈︎'],
  supportPhrase: this.supportPhrases[mood]   ?? this.supportPhrases['Нормально'],
  holiday:       resolveHoliday(date),        // локальный справочник, всегда есть значение
}
```

**Fallback-словари:**
- **12 знаков зодиака** — каждый с `main`, `detailed`, `advice`, `moon`, `aspect`
- **6 настроений** — 5 фраз на каждое (`Спокойна`, `Нормально`, `Устала`, `Тревожна`, `Грустна`, `Воодушевлена`)
- **`resolveHoliday(date)`** — 130+ праздников + 7 wellness-тем в ротации по дню года (никогда не вернёт `null`)

---

### 4.5 Push-уведомления: CRON + UTC

```
[VPS, каждую минуту]
NotificationCronService.handleCron()
          │
          ▼
currentTime = UTCHours:UTCMinutes ("09:00" UTC)
          │
          ▼
Prefs.findMany WHERE:
  pushTime = currentTime          ← хранится в UTC (frontend конвертит через localTimeToUtc)
  horoscopeEnabled = true
  fcmTokens NOT empty
          │
          ▼
for each user:
  pack = getTodayPack(userId)     ← DailyFeed или AI
  firebase.sendPushNotification(token, "Твой гороскоп", pack.horoscope.main)
  Notification.create({ type: 'daily_horoscope', status: 'sent' })
```

> **Timezone correctness:** Пользователь выбирает "09:00" у себя на экране → `localTimeToUtc("09:00")` конвертирует в UTC перед отправкой на бэк → бэк хранит и сравнивает только UTC → пуш приходит ровно в 9 утра по часовому поясу пользователя.

---

### 4.6 Immutable Bookmarks

```typescript
// bookmarks.service.ts — create()
prisma.bookmark.create({
  data: {
    userId,
    type: "гороскоп",          // "гороскоп" | "поддержка"
    payload: {                  // JSONB snapshot — снапшот на момент нажатия
      date: "29.04",
      text: "Сегодня день решительных действий...",
      icon: "auto_awesome",
    },
  },
})
```

> **Почему JSONB-снапшот?** Если гороскоп в БД изменится (ре-генерация, исправление) — сохранённые закладки пользователя **не изменятся**. Они навсегда хранят именно тот текст, что пользователь прочитал. `payload` — это неизменяемое поле `Json` в Prisma (PostgreSQL JSONB).

---

### 4.7 FCM Token Management (Dumb Client)

```
PWA                                     Бэкенд
 │                                          │
 ├─ Notification.requestPermission() ──────►│
 │  SW получает FCM-токен от Firebase       │
 │  (firebase-messaging-sw.js)              │
 │                                          │
 ├─ POST /push/subscribe { fcm_token } ────►│ atomic array_append:
 │                                          │ UPDATE prefs SET fcm_tokens =
 │                                          │   array_append(fcm_tokens, $token)
 │                                          │ WHERE NOT (fcm_tokens @> ARRAY[$token])
 │◄─ { subscribed: true } ─────────────────┤
```

> **Дизайн-решение:** PWA — "тупой клиент". Он только регистрирует FCM-токен. Вся логика расписания, контента уведомлений и тригеров — строго на сервере. `array_append` с проверкой атомарен: два устройства не добавят токен дважды.

---

## 🗄 5. DATABASE SCHEMA

### ER-диаграмма (упрощённая)

```
User (1) ──── (1) Profile      (birthdate, zodiacSign, gender, currentMood)
     │
     └─────── (1) Prefs        (pushTime UTC, fcmTokens[], horoscopeEnabled, timezone)
     │
     └─────── (N) DailyFeed    (date "DD.MM") ── join-таблица
     │              │
     │              ├──► (N:1) Horoscope      (date + zodiacSign UNIQUE)
     │              ├──► (N:1) SupportPhrase  (mood, text)
     │              └──► (N:1) Holiday        (date UNIQUE, title)
     │
     └─────── (N) Bookmark     (type, payload JSONB — snapshot)
     └─────── (N) MoodLog      (mood, changedAt — audit)
     └─────── (N) Notification (type, status, sentAt — audit)
```

### Ключевые концепции

| Таблица | Назначение | Уникальность |
|---|---|---|
| `users` | Аккаунт: email, OTP hash, refresh token hash | `email` |
| `profile` | Астро-профиль: знак, настроение | `userId` (1:1) |
| `prefs` | Устройства, пуш-настройки, таймзона | `userId` (1:1) |
| `horoscopes` | **Shared ref:** 1 запись на (дата + знак) для всех | `(date, zodiacSign)` |
| `support_phrases` | Все сгенерированные фразы (не уникальны) | id |
| `holidays` | **Shared ref:** 1 запись на дату | `date` |
| `daily_feed` | **Join:** конкретный юзер ↔ контент на конкретный день | `(userId, date)` |
| `bookmarks` | Иммутабельные JSONB-снапшоты | id |
| `mood_logs` | Аудит всех смен настроения | — |
| `notifications` | Аудит всех отправленных пушей | — |

### Почему shared ref-таблицы?

```
❌ Без shared refs:
   1000 пользователей-Скорпионов → 1000 AI-вызовов в день → $$$

✅ С shared refs:
   1000 пользователей-Скорпионов → 1 AI-вызов (Redis HIT)
   → 1 запись в horoscopes → 1000 записей в daily_feed (разные userId)
```

---

## 🔐 6. SECURITY GUARDRAILS

| Правило | Реализация |
|---|---|
| **AI-ключи только на бэке** | `AI_API_KEY` строго в `.env.prod` на VPS. PWA не знает об OpenAI |
| **OTP одноразовый** | После `verifyOtp()` → `otpHash = null, otpExpiresAt = null` |
| **Refresh token rotation** | Каждый `/auth/refresh` генерирует новую пару + перезаписывает хэш |
| **Rate limiting** | ThrottlerGuard: 10 req/60s глобально |
| **DTO validation** | `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` |
| **Mood validation** | `@IsIn(['Спокойна','Нормально','Устала','Тревожна','Грустна','Воодушевлена'])` |
| **Atomic FCM append** | `$executeRaw` с `NOT (fcm_tokens @> ARRAY[$token])` |
| **Bookmarks ownership** | `deleteMany({ id, userId })` — нельзя удалить чужую закладку |

---

## 🚀 7. DEPLOYMENT

### Production Stack (VPS 157.22.198.107)

```
Docker Compose:
  postgres:15-alpine  ← healthcheck: pg_isready
  redis:7-alpine      ← healthcheck: redis-cli ping
  api (NestJS)        ← depends_on: service_healthy (оба)
                         command: prisma migrate deploy && node dist/main.js
```

### ENV-переменные (`.env.prod` на VPS, никогда в git)

```env
DATABASE_URL=postgresql://postgres:PASSWORD@db:5432/yoyojoy_day
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=...       (32+ случайных символа)
JWT_REFRESH_SECRET=...      (другой, 32+ символа)
JWT_ACCESS_TTL=900          (15 минут в секундах)
JWT_REFRESH_TTL=2592000     (30 дней)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx   (Gmail App Password)
SMTP_FROM_NAME=YoYoJoy Day
AI_API_KEY=sk-...           (когда клиент купит)
FIREBASE_SERVICE_ACCOUNT='{...}'    (JSON строкой)
```

### Deploy Process

```bash
# На локалке:
./deploy.sh                    # rsync backend/ → VPS + docker compose up

# На VPS автоматически:
docker compose -f docker-compose.prod.yml up -d --build
npx prisma migrate deploy      # идемпотентно, пропускает уже применённые
node dist/main.js
```

---

## 📋 8. API ENDPOINTS REFERENCE

| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Email → OTP на почту |
| `POST` | `/api/auth/verify-otp` | — | Проверка OTP → JWT |
| `POST` | `/api/auth/refresh` | — | Refresh → новая пара JWT |
| `POST` | `/api/auth/logout` | ✅ | Инвалидация refresh |
| `GET` | `/api/today` | ✅ | Daily Pack (3-level cache) |
| `POST` | `/api/today/support/next` | ✅ | "Другая фраза" (всегда новая) |
| `GET` | `/api/profile` | ✅ | Профиль + префы |
| `PATCH` | `/api/profile` | ✅ | Обновление birthdate/zodiac/gender/pushTime |
| `PATCH` | `/api/profile/mood` | ✅ | Смена настроения (partial update) |
| `GET` | `/api/bookmarks` | ✅ | Список закладок |
| `POST` | `/api/bookmarks` | ✅ | Сохранить снапшот |
| `DELETE` | `/api/bookmarks/:id` | ✅ | Удалить свою закладку |
| `POST` | `/api/push/subscribe` | ✅ | Регистрация FCM-токена |
| `POST` | `/api/push/test` | ✅ | Тестовый пуш |
| `DELETE` | `/api/push` | ✅ | Отписка от пушей |

---

## 🗺 9. ROADMAP STATUS

| Фаза | Статус | Что сделано |
|---|---|---|
| **Phase 1** — Core Auth & Push | ✅ Done | OTP через Gmail SMTP, JWT rotation, FCM CRON scheduler |
| **Phase 2** — AI Brain Foundation | ✅ Done | OpenAI Structured Outputs, fallback-политика, partial updates |
| **Phase 3** — PWA Magic & Frontend Polish | ✅ Done | Landscape-адаптация всех 11 страниц, Framer Motion, SW |
| **Phase 4** — Production Deployment | ✅ Done | VPS + Docker Compose, Cloudflare Tunnel (временно) |
| **Phase 5** — Domain + SSL | ⏳ Pending | Клиент покупает домен → Nginx + Let's Encrypt → обновить `VITE_API_BASE_URL` на Vercel |
| **Phase 6** — Real AI Key | ⏳ Pending | Добавить `AI_API_KEY=sk-...` в `.env.prod` → все режим из fallback переключится в реальный |

---

## 🆘 10. QUICK TROUBLESHOOTING

| Симптом | Причина | Решение |
|---|---|---|
| Гороскоп не генерируется | `AI_API_KEY` не задан | Fallback работает автоматически. Добавить ключ в `.env.prod` |
| Пуш не приходит | FCM-токен устарел | Переподписаться в настройках → `POST /push/subscribe` |
| OTP не приходит на почту | SMTP-пароль/порт | В dev: смотреть в логи NestJS (`OTP code: [1234]`) |
| 401 в продакшне | Refresh token истёк (30d) | Пользователь должен перелогиниться |
| Верстка сломана в landscape | `md:` класс вместо `landscape:` | Только `landscape:` модификатор! |
| Неверная дата гороскопа | Серверный UTC vs таймзона | `getTodayDateStr(prefs.timezone)` — исправлено в v1.0 |

---

> 📌 **Для просмотра БД:** `cd backend && npx prisma studio` (локально) или SSH-туннель `ssh -L 5555:localhost:5555 root@157.22.198.107` + запустить studio на VPS.
>
> 📌 **Для деплоя:** `./deploy.sh` из корня проекта.
>
> 📌 **Для логов на VPS:** `ssh root@157.22.198.107` → `docker compose -f /root/yoyojoy-backend/docker-compose.prod.yml logs -f api`
