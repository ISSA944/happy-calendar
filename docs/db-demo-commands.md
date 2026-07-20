# Команды для демонстрации базы данных на созвоне

## Перед звонком — подключиться

В PowerShell:
```
ssh root@157.22.198.107
```

На VPS:
```
cd /root/yoyojoy-backend && docker compose -f docker-compose.prod.yml exec db psql -U postgres -d yoyojoy_day
```

Внутри базы приглашение станет: `yoyojoy_day=#`

---

## Команды для демонстрации (копируй и вставляй)

### 1. Показать все таблицы
```
\dt
```

### 2. Все пользователи
```sql
SELECT email, name, created_at FROM users ORDER BY created_at DESC;
```

### 3. Профили (знак, настроение, пол)
```sql
SELECT u.email, p.zodiac_sign, p.current_mood, p.gender, p.birthdate FROM profile p JOIN users u ON u.id = p.user_id;
```

### 4. Настройки уведомлений
```sql
SELECT u.email, p.push_time, p.horoscope_enabled, p.holidays_enabled, p.support_enabled, p.timezone FROM prefs p JOIN users u ON u.id = p.user_id;
```

### 5. Закладки пользователей
```sql
SELECT u.email, b.type, b.date, LEFT(b.text, 50) AS preview FROM bookmarks b JOIN users u ON u.id = b.user_id ORDER BY b.created_at DESC;
```

### 6. История уведомлений
```sql
SELECT u.email, n.type, n.title, n.date, n.created_at FROM notifications n JOIN users u ON u.id = n.user_id ORDER BY n.created_at DESC LIMIT 20;
```

### 7. Push-подписки (на каких устройствах)
```sql
SELECT u.email, s.user_agent, s.created_at FROM web_push_subscriptions s JOIN users u ON u.id = s.user_id;
```

### 8. Сгенерированные гороскопы
```sql
SELECT zodiac_sign, LEFT(main, 80) AS preview, created_at FROM horoscopes ORDER BY created_at DESC LIMIT 20;
```

### 9. Фразы поддержки
```sql
SELECT mood, LEFT(text, 80) AS preview, created_at FROM support_phrases ORDER BY created_at DESC LIMIT 20;
```

### 10. Праздники
```sql
SELECT date, title FROM holidays ORDER BY date LIMIT 20;
```

### 11. Лог смены настроений
```sql
SELECT u.email, m.mood, m.created_at FROM mood_logs m JOIN users u ON u.id = m.user_id ORDER BY m.created_at DESC LIMIT 20;
```

### 12. Сводка — сколько чего в базе
```sql
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL SELECT 'profile', COUNT(*) FROM profile
UNION ALL SELECT 'bookmarks', COUNT(*) FROM bookmarks
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'horoscopes', COUNT(*) FROM horoscopes
UNION ALL SELECT 'support_phrases', COUNT(*) FROM support_phrases
UNION ALL SELECT 'web_push_subscriptions', COUNT(*) FROM web_push_subscriptions;
```

### Выйти из базы
```
\q
```

---

## Что говорить под каждую команду

**После `\dt`:**
«Вот наша база PostgreSQL — 13 таблиц. Каждая отвечает за свою область: пользователи, профили, гороскопы, закладки, уведомления, и так далее. Все таблицы связаны между собой через идентификаторы.»

**После команды 2 (users):**
«Реальные пользователи, которые уже зарегистрированы. Видите даты — система живая, работает.»

**После команды 3 (профили):**
«Здесь видно как для каждого пользователя сохранён его астрологический профиль — знак зодиака, текущее настроение, пол. Эти данные нейросеть использует для персонализации.»

**После команды 4 (настройки):**
«Настройки уведомлений каждого пользователя — время, типы контента, часовой пояс.»

**После команды 5 (закладки):**
«Сохранённые пользователями тексты. Они хранятся как неизменяемые снимки.»

**После команды 6 (уведомления):**
«История всех отправленных push-уведомлений. Каждый push автоматически фиксируется в базе.»

**После команды 7 (подписки):**
«Зарегистрированные устройства пользователей. Видно с какого браузера и операционной системы они подписались.»

**После команды 12 (сводка):**
«Финальная сводка — сколько у нас всего записей в каждой категории.»
