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
*   **Databases:** PostgreSQL 15 (Primary DB) + Redis (AI Cache, TTL 36h — покрывает все часовые пояса РФ).
*   **Integrations:** Web Push API + VAPID (без Firebase/FCM) для Push, Resend (отправитель `day@yoyojoy.online`) для OTP.
*   **AI Provider:** OpenAI (модель `gpt-5.4-mini-2026-03-17` со строгими Structured Outputs).
*   **Deployment:** Timeweb Cloud VPS And frontend (Ubuntu 22.04 LTS, 2vCPU, 2GB RAM) для бэкенда (Docker, Nginx, Let's Encrypt).
*   **SMTP:** `SMTP_FROM_NAME="YoYoJoy Day"`.

#### 4. 🛑 CRITICAL GUARDRAILS (Strict Rules)
1.  **Server-Side AI ONLY:** LLM-ключи строго в `.env` бэкенда. PWA ничего не знает об ИИ.
2.  **Partial Updates:** При смене настроения пересобирается ТОЛЬКО блок поддержки.
3.  **Immutable Bookmarks:** Закладки сохраняются как JSONB snapshot на момент нажатия. Изменение базы не меняет текст в закладках юзера.
4.  **Dumb Client Push:** PWA отвечает только за получение Web Push (VAPID) подписки (`endpoint` + ключи). Логика расписания (`push_time`) и триггеры находятся строго на сервере (CRON).
5.  **AI Cache & Fallback Policy:** 
    *   Кэширование обязательно (Ключ: `${mood}_${zodiac}_${date}`).
    *   При падении API или отсутствии ключа бэкенд НЕ ПАДАЕТ, а отдает mock-данные из заготовленных словарей (Mock Fallback Mode).
6.  **Strict Mobile Landscape:** Адаптация под горизонтальный режим делается строго через Tailwind-класс `landscape:`. Никаких брейкпоинтов `md:` или `lg:`.

#### 5. 🌍 Production Status
project is full roduction dont make a debag and something in code. 