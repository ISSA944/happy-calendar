### YoYoJoy Day — System Context & Architecture (L1)

#### 1. Role & Product Vision
Ты — Senior Fullstack Developer / Lead Backend Architect. 
**Продукт:** PWA-компаньон к бумажному календарю. 
**Ценность:** Юзер сканирует QR, проходит онбординг и ежедневно получает персонализированный контент: гороскоп, фразу поддержки и праздник. 
**Дизайн-система:** Zen-Emerald (#006a65, #2FA7A0, #fcf9f4). Mobile-first, адаптивная верстка с поддержкой горизонтального (landscape) режима ТОЛЬКО для мобильных устройств (через модификатор `landscape:`). Десктопы и планшеты центрируют мобильный интерфейс без растягивания.

#### 2. User Flow & Core Mechanics
*   **Onboarding:** QR → Welcome → Регистрация (Email) → OTP → Разрешение на Push → Настройка профиля (дата рождения, знак, пол) → Home.
*   **Daily Loop:** Push-уведомление → Открытие Home → Чтение/Сохранение в закладки.
*   **Mood Mechanic (Hybrid Flow):** 6 настроений. При смене настроения на главной странице обновляется **ТОЛЬКО** блок поддержки (текст + баннер). Гороскоп и праздник остаются неизменными для экономии LLM токенов.

#### 3. Tech Stack & Infrastructure
*   **Frontend (PWA):** React 19 + TypeScript + Vite + Tailwind CSS + Zustand + Framer Motion + Vite PWA Plugin.
*   **Backend (API Gateway):** Node.js + NestJS 11 + Prisma ORM 6.
*   **Databases:** PostgreSQL 15 (Primary DB) + Redis (AI Cache, TTL 24h).
*   **Integrations:** Firebase Cloud Messaging (FCM) для Push, Gmail SMTP для OTP.
*   **AI Provider:** OpenAI (модель `gpt-5.4-mini-2026-03-17` со строгими Structured Outputs).
*   **Deployment:** Vercel (Front) + Timeweb Cloud VPS (Ubuntu 22.04 LTS, 2vCPU, 2GB RAM) для бэкенда (Docker, Nginx, Let's Encrypt).
*   **SMTP:** `SMTP_FROM_NAME="YoYoJoy Day"`.

#### 4. 🛑 CRITICAL GUARDRAILS (Strict Rules)
1.  **Server-Side AI ONLY:** LLM-ключи строго в `.env` бэкенда. PWA ничего не знает об ИИ.
2.  **Partial Updates:** При смене настроения пересобирается ТОЛЬКО блок поддержки.
3.  **Immutable Bookmarks:** Закладки сохраняются как JSONB snapshot на момент нажатия. Изменение базы не меняет текст в закладках юзера.
4.  **Dumb Client Push:** PWA отвечает только за получение `fcm_token`. Логика расписания (`push_time`) и триггеры находятся строго на сервере (CRON).
5.  **AI Cache & Fallback Policy:** 
    *   Кэширование обязательно (Ключ: `${mood}_${zodiac}_${date}`).
    *   При падении API или отсутствии ключа бэкенд НЕ ПАДАЕТ, а отдает mock-данные из заготовленных словарей (Mock Fallback Mode).
6.  **Strict Mobile Landscape:** Адаптация под горизонтальный режим делается строго через Tailwind-класс `landscape:`. Никаких брейкпоинтов `md:` или `lg:`.

#### 5. 🌍 Production Status
*   **Frontend:** `https://yoyojoy.online` → Vercel (auto-deploy от push в main ветку `ISSA944/happy-calendar`)
*   **Backend:** `https://api.yoyojoy.online` → VPS `157.22.198.107`, Docker Compose, SSL до августа 2026
*   **Репозиторий разработки:** `github.com/ISSA944/happy-calendar`
*   **Репозиторий клиента:** `github.com/yoyotech2026/yoyojoy-day` (приватный, чистая история)
*   **VPS деплой:** `cd /root/yoyojoy-backend && docker compose -f docker-compose.prod.yml build api && docker compose -f docker-compose.prod.yml up -d api`
*   **AI:** Сейчас в fallback (mock) режиме. Для включения — добавить `AI_API_KEY` в `/root/yoyojoy-backend/.env.prod` и перезапустить контейнер.
*   **Vercel ENV обязательные:** `VITE_API_BASE_URL=https://api.yoyojoy.online/api` + все `VITE_FIREBASE_*`

#### 6. ✅ Что уже сделано
*   Полный онбординг: Welcome → Регистрация → OTP → Push → ProfileSetup → Home
*   JWT авторизация: access (15 мин) + refresh (30 дней) с ротацией, auto-refresh interceptor (single-flight)
*   AI генерация: гороскоп + фраза поддержки + праздник, Redis кэш 24ч, fallback словари для всех 12 знаков
*   6 настроений с gender-aware метками, partial update только фразы поддержки
*   Push уведомления: FCM, CRON каждую минуту, UTC timezone-correct
*   Закладки: JSONB snapshot, иммутабельные
*   Landscape адаптация всех 11 страниц (только `landscape:`)
*   PageLoader прелоадер (портал, Framer Motion, показывается один раз после онбординга)
*   Nginx + SSL на VPS, CORS настроен под `yoyojoy.online` + `*.vercel.app`
*   Исправлены критичные баги: timezone в getTodayDateStr, zodiac mismatch в DailyFeed, Redis lock против двойных AI вызовов

#### 7. 🔲 Project Final Steps (Остаток)

**Шаг 1 — Перенос на аккаунт клиента** *(заготовка готова)*
- GitHub `yoyotech2026/yoyojoy-day` создан и заполнен
- Создать Vercel аккаунт клиента, подключить этот репо
- Прописать все ENV переменные, добавить домен `yoyojoy.online`

**Шаг 2 — Фронтенд фиксы**
- Прелоадер — доработать дизайн если нужно
- Логотип — добавить PWA иконку (favicon + pwa-192/512)
- Проверить логику PWA установки (A2HS)

**Шаг 3 — Push уведомления (ПРИОРИТЕТ)**
- Проверить реально ли приходят пуши на телефон
- Проверить FCM токен сохраняется в БД
- Убедиться что CRON на VPS срабатывает по расписанию

**Шаг 4 — AI подключение и тест**
- Добавить `AI_API_KEY` в `.env.prod` на VPS
- Протестировать генерацию гороскопа и фраз
- Убедиться что Redis кэш работает (1 вызов на знак/день)

**Шаг 5 — Финальное тестирование**
- Полный онбординг от начала до конца
- Все экраны portrait + landscape
- Мелкие баг фиксы

**Шаг 6 — Документ для созвона с клиентом (Zoom)**
- Google Doc: что сделано, как работает, стек и обоснование
- Передача доступов клиенту


 CLAUDE.md never commit.