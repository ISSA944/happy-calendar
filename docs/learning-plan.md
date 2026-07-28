# IT Learning Plan — YoYoJoy Day Stack
> Этот файл — твой личный учебный план. Загрузи его в claude.ai и скажи:
> **"Привет! У меня есть файл learning-plan.md. Давай начнём с Дня 1 — объясни мне тему по плану: теория, потом закрепление по проекту, потом практика и тест."**
> Каждый день — один инструмент. Не торопись.

---

## Контекст проекта (для Claude в браузере)

**YoYoJoy Day** — мобильное PWA-приложение (сайт который работает как приложение на телефоне).
Пользователь сканирует QR-код с бумажного календаря, регистрируется и каждый день получает:
- персональный гороскоп
- фразу поддержки по настроению
- праздник дня

**Стек:**
- Фронтенд: React + TypeScript + Vite + Tailwind CSS + Zustand + Framer Motion
- Бэкенд: Node.js + NestJS + Prisma ORM
- Базы данных: PostgreSQL + Redis
- Инфраструктура: Docker + Nginx + Linux VPS
- Интеграции: OpenAI API, Web Push уведомления
- Деплой: SCP на VPS (157.22.198.107), домен yoyojoy.online

---

## Расписание по дням

| День | Инструмент | Категория |
|------|-----------|-----------|
| 1 | Git & GitHub | Основы |
| 2 | Linux & Terminal | Основы |
| 3 | Node.js & npm | Backend |
| 4 | TypeScript | Языки |
| 5 | React | Frontend |
| 6 | Vite | Frontend |
| 7 | Tailwind CSS | Frontend |
| 8 | Zustand | Frontend |
| 9 | Framer Motion | Frontend |
| 10 | PWA (Progressive Web App) | Frontend |
| 11 | NestJS | Backend |
| 12 | REST API | Backend |
| 13 | PostgreSQL | Базы данных |
| 14 | Prisma ORM | Базы данных |
| 15 | Redis | Базы данных |
| 16 | Docker | Инфраструктура |
| 17 | Nginx | Инфраструктура |
| 18 | JWT & Аутентификация | Безопасность |
| 19 | OpenAI API | AI |
| 20 | Web Push уведомления | Интеграции |

---

## День 1 — Git & GitHub

### Что это
Git — система контроля версий. Программа которая запоминает все изменения в коде.
GitHub — сайт где хранятся git-репозитории. Облако для кода.

### Зачем это вообще нужно (в мире)
Представь что ты пишешь книгу и хочешь сохранить каждую версию главы. Git делает именно это с кодом:
- Можно вернуться к любой версии кода
- Несколько разработчиков могут работать над одним проектом одновременно
- Если что-то сломалось — откатываешься назад за 10 секунд
- Вся история изменений хранится вечно

Без Git невозможно работать в команде. Это как Word без функции "отменить".

**Где используется:** абсолютно везде — стартапы, Google, Netflix, любой IT-проект на планете.

### Как устроено

**Репозиторий (repo)** — папка проекта под управлением git.

**Основные команды:**
```bash
git init              # создать новый репозиторий
git clone <url>       # скопировать чужой репозиторий
git status            # посмотреть что изменилось
git add .             # добавить изменения в "корзину"
git commit -m "текст" # сохранить изменения с описанием
git push              # загрузить на GitHub
git pull              # скачать изменения с GitHub
git log               # история коммитов
```

**Ветки (branches):**
- `main` — основная ветка (продакшн)
- Новая функция → создаёшь ветку → делаешь → сливаешь в main
```bash
git checkout -b feature/new-button  # создать ветку
git checkout main                    # переключиться на main
git merge feature/new-button         # слить ветку
```

**Pull Request (PR)** — запрос на слияние веток. На GitHub можно обсудить изменения перед тем как принять их в main.

### В нашем проекте
- Репозиторий: `github.com/ISSA944/happy-calendar`
- Ветка: `main` — то что в продакшне
- Каждое изменение коммитится с описанием что сделано
- Второй репозиторий `github.com/yoyotech2026/yoyojoy-day` — для клиента, без истории разработки

**Реальные коммиты из проекта:**
```
feat: add Yandex Metrika counter (ID 109427116)
feat: update holidays calendar
test: auto-wipe test account on re-registration
```

### Практика
1. Зайди на github.com и создай аккаунт если нет
2. Создай новый репозиторий "my-first-repo"
3. Создай файл `hello.txt` с текстом "Привет мир"
4. Сделай commit прямо в интерфейсе GitHub
5. Посмотри историю коммитов

### Тест (ответь Claude в чате)
1. Чем отличается `git add` от `git commit`?
2. Зачем нужны ветки?
3. Что такое `git push` и куда он отправляет данные?
4. Что произойдёт если два разработчика изменили одну строку кода одновременно?
5. Объясни своими словами зачем вообще нужен GitHub если git уже есть локально?

---

## День 2 — Linux & Terminal

### Что это
Linux — операционная система. Как Windows или macOS, но бесплатная и с открытым кодом.
Terminal (терминал) — программа для управления компьютером через текстовые команды.

### Зачем это вообще нужно (в мире)
96% всех серверов в интернете работают на Linux. Когда ты открываешь любой сайт — скорее всего где-то работает Linux-сервер.

Терминал нужен потому что:
- Серверы не имеют графического интерфейса (нет мышки и окон)
- Командная строка быстрее и мощнее для автоматизации
- Можно управлять удалёнными серверами через SSH

### Как устроено

**Структура файловой системы Linux:**
```
/                    # корень (как диск C:\ в Windows)
├── home/           # домашние папки пользователей
├── var/www/        # файлы сайтов (стандарт для веб)
├── etc/            # конфигурационные файлы
├── root/           # домашняя папка суперпользователя root
└── tmp/            # временные файлы
```

**Основные команды:**
```bash
ls                  # список файлов в папке
ls -la              # подробный список с правами
cd /var/www         # перейти в папку
pwd                 # показать текущую папку
mkdir mydir         # создать папку
rm file.txt         # удалить файл
rm -rf folder/      # удалить папку со всем содержимым (ОСТОРОЖНО!)
cp file.txt copy.txt # скопировать файл
mv file.txt new.txt  # переименовать/переместить
cat file.txt        # показать содержимое файла
nano file.txt       # редактор файлов в терминале
```

**Права доступа:**
```
drwxr-xr-x  — папка, права: владелец(rwx) группа(r-x) остальные(r-x)
-rw-r--r--  — файл, права: владелец(rw-) группа(r--) остальные(r--)

r = read (чтение)
w = write (запись)
x = execute (выполнение)

chmod 755 folder/   # дать права 755 (rwxr-xr-x)
chmod 644 file.txt  # дать права 644 (rw-r--r--)
```

**SSH — удалённый доступ:**
```bash
ssh root@157.22.198.107   # подключиться к серверу
scp file.txt root@server:/path/  # скопировать файл на сервер
```

**Полезные команды:**
```bash
ps aux              # список запущенных процессов
kill 12345          # убить процесс по ID
df -h               # место на диске
free -h             # память RAM
top / htop          # мониторинг ресурсов в реальном времени
```

### В нашем проекте
- Сервер: Ubuntu 22.04 LTS на VPS 157.22.198.107
- Фронтенд лежит в `/var/www/yoyojoy-frontend/dist/`
- Бэкенд в `/root/yoyojoy-backend/`
- Nginx конфигурация в `/etc/nginx/sites-enabled/`

**Реальная проблема которую мы решали:**
После загрузки файлов на сервер через SCP папка `assets/` получала права `700` (drwx------).
Это значит — только root может читать. Nginx работает не от root — получал отказ → белый экран.
Решение: `chmod 755 assets/ && chmod 644 assets/*`

### Практика
Если есть Mac или Linux — открой Terminal.
Если Windows — открой PowerShell.
1. Введи `ls` (или `dir` на Windows) — посмотри что выводится
2. Введи `cd Desktop` — перейди на рабочий стол
3. Введи `mkdir test-folder` — создай папку
4. Введи `cd test-folder` — войди в неё
5. Введи `pwd` — посмотри полный путь

### Тест
1. Что означают права `rwxr-xr-x`?
2. Почему `rm -rf` опасная команда?
3. Зачем нужен SSH?
4. Чем отличается `/home/user/` от `/root/`?
5. Наш сервер показывал белый экран из-за прав доступа. Объясни почему права 700 на папку это проблема для Nginx.

---

## День 3 — Node.js & npm

### Что это
Node.js — среда выполнения JavaScript вне браузера. Позволяет запускать JS на сервере.
npm (Node Package Manager) — менеджер пакетов. Магазин готовых библиотек для JavaScript.

### Зачем это вообще нужно (в мире)
Раньше JavaScript работал только в браузере. Node.js в 2009 году изменил это — теперь JS можно использовать для серверов, скриптов, утилит.

**Почему Node.js популярен:**
- Один язык (JS) и на фронтенде и на бэкенде
- Очень быстрый для I/O операций (запросы к базе, файлы)
- Огромная экосистема пакетов (npm имеет >2 млн пакетов)
- Используют: Netflix, LinkedIn, Uber, PayPal

**npm** решает проблему "я не хочу писать всё с нуля". Нужна работа с датами? `npm install dayjs`. Нужна валидация форм? `npm install zod`. 

### Как устроено

**package.json** — паспорт проекта:
```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**dependencies vs devDependencies:**
- `dependencies` — нужны в продакшне (express, react)
- `devDependencies` — только для разработки (typescript, eslint)

**Основные команды:**
```bash
npm install              # установить все зависимости из package.json
npm install express      # установить конкретный пакет
npm install -D typescript # установить как devDependency
npm run dev              # запустить скрипт "dev"
npm run build            # запустить скрипт "build"
npx create-react-app .   # запустить пакет без установки
```

**node_modules** — папка со всеми установленными пакетами. Никогда не коммить в git (добавь в .gitignore). Весит сотни мегабайт.

**package-lock.json** — точные версии всех зависимостей. Гарантирует что у всех разработчиков одинаковые версии.

### В нашем проекте
- Фронтенд: `npm run dev` — запустить для разработки, `npm run build` — собрать продакшн
- Бэкенд: NestJS (тоже Node.js), запускается через Docker

**Из нашего package.json:**
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview"
}
```
`npm run build` сначала проверяет TypeScript (`tsc -b`), потом собирает билд через Vite.

### Практика
1. Установи Node.js с nodejs.org
2. Открой терминал, введи `node --version` — должна показаться версия
3. Введи `npm --version`
4. Создай папку `my-node-app`
5. Внутри введи `npm init -y` — создаст package.json
6. Введи `npm install chalk` — установи пакет для цветного текста
7. Создай файл `index.js` с содержимым: `const chalk = require('chalk'); console.log(chalk.green('Привет мир!'));`
8. Запусти: `node index.js`

### Тест
1. Чем Node.js отличается от браузерного JavaScript?
2. Зачем нужен package-lock.json?
3. Почему node_modules не коммитят в git?
4. В чём разница между `dependencies` и `devDependencies`?
5. Что происходит когда ты вводишь `npm run build` в нашем проекте?

---

## День 4 — TypeScript

### Что это
TypeScript — JavaScript с типами. Надстройка над JS от Microsoft, которая добавляет строгую типизацию.

### Зачем это вообще нужно (в мире)
JavaScript — динамический язык. Переменная может быть строкой, потом числом, потом объектом. Это гибко, но в больших проектах ведёт к ошибкам которые ловятся только в продакшне.

**Проблема JS:**
```javascript
function getUserAge(user) {
  return user.age; // а если user = null? Краш в продакшне
}
```

**Решение TypeScript:**
```typescript
function getUserAge(user: { age: number } | null): number | null {
  return user?.age ?? null; // TypeScript заставит обработать null
}
```

**Преимущества:**
- Ошибки видны ещё при написании кода (не в продакшне)
- Автодополнение в редакторе работает намного лучше
- Код самодокументируется через типы
- Рефакторинг без страха — TypeScript скажет где что сломалось

**Используется:** большинство серьёзных проектов на JS переходят на TS. Angular, Vue 3, React — всё поддерживает TypeScript.

### Как устроено

**Базовые типы:**
```typescript
let name: string = "Евгений"
let age: number = 30
let isActive: boolean = true
let items: string[] = ["a", "b", "c"]
let tuple: [string, number] = ["hello", 42]
```

**Интерфейсы и типы:**
```typescript
interface User {
  id: string
  name: string
  email: string
  age?: number  // ? означает необязательное поле
}

type Mood = "Спокойна" | "Нормально" | "Устала" | "Тревожна"
// union type — только одно из этих значений
```

**Generics — обобщённые типы:**
```typescript
function getFirst<T>(arr: T[]): T {
  return arr[0]
}
// T — любой тип, TypeScript определит его автоматически
getFirst([1, 2, 3])     // вернёт number
getFirst(["a", "b"])    // вернёт string
```

**tsconfig.json** — конфигурация TypeScript компилятора.

TypeScript компилируется в обычный JavaScript — браузеры его не понимают напрямую.

### В нашем проекте
Весь код написан на TypeScript. Например из нашего бэкенда:

```typescript
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\.\d{2}\.\d{4}$/)
  birthdate?: string;  // необязательная строка формата DD.MM.YYYY

  @IsOptional()
  @IsBoolean()
  horoscopeEnabled?: boolean;  // необязательный boolean
}
```

TypeScript + декораторы NestJS — мощная комбинация: тип сразу описывает и структуру данных и правила валидации.

### Практика
1. Зайди на typescriptlang.org/play — онлайн-редактор TS
2. Напиши интерфейс `Product` с полями: id (number), name (string), price (number), inStock (boolean)
3. Напиши функцию `getExpensive(products: Product[], minPrice: number): Product[]` которая возвращает дорогие товары
4. Намеренно сделай ошибку — передай строку вместо числа — посмотри что скажет TypeScript

### Тест
1. Зачем TypeScript если JavaScript уже работает?
2. Чем `interface` отличается от `type`?
3. Что такое `undefined` vs `null` в TypeScript?
4. Что делает `?` в `age?: number`?
5. TypeScript компилируется в что? Почему браузеры не понимают TS напрямую?

---

## День 5 — React

### Что это
React — JavaScript библиотека для построения пользовательских интерфейсов. Создана Facebook (Meta) в 2013 году.

### Зачем это вообще нужно (в мире)
До React интерфейсы делали через прямое изменение HTML через DOM API. Это было медленно и неудобно при сложных приложениях.

**Проблема без React:**
```javascript
// При каждом изменении данных надо вручную найти элемент и обновить
document.getElementById('user-name').textContent = newName
document.getElementById('user-avatar').src = newAvatar
// В сложном приложении это превращается в кошмар
```

**Идея React:** опиши как должен выглядеть UI при данных X, а React сам разберётся что изменить.

**Используется:** Facebook, Instagram, Airbnb, Netflix, Notion, сотни тысяч компаний.

### Как устроено

**Компоненты** — строительные блоки React. Каждый компонент = функция которая возвращает JSX:
```tsx
function Button({ text, onClick }: { text: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn">
      {text}
    </button>
  )
}
```

**JSX** — смесь JavaScript и HTML. Компилируется в обычный JS.

**useState — состояние компонента:**
```tsx
function Counter() {
  const [count, setCount] = useState(0)  // count = текущее значение

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  )
}
```

**useEffect — побочные эффекты:**
```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Вызывается после рендера
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setUser)
  }, [userId])  // перезапускается когда userId изменился

  return <div>{user?.name}</div>
}
```

**Virtual DOM** — React держит виртуальную копию DOM в памяти. При изменении данных сравнивает старый и новый Virtual DOM, находит минимальный набор изменений и обновляет реальный DOM. Это быстро.

### В нашем проекте
Весь фронтенд — React 19 компоненты.

**Например HomePage.tsx (упрощённо):**
```tsx
export function HomePage() {
  const { currentMood, dailyPack } = useAppStore()
  const moodImage = getMoodImage(currentMood)

  return (
    <div>
      <h1>Добрый вечер</h1>
      <img src={moodImage} alt={currentMood} />
      <p>{dailyPack?.supportPhrase}</p>
    </div>
  )
}
```

### Практика
Зайди на codesandbox.io → New Sandbox → React
1. Создай компонент `MoodSelector` с кнопками: Радость, Грусть, Злость
2. При нажатии на кнопку — показывай текст "Ты выбрал: [настроение]"
3. Используй `useState` для хранения выбранного настроения

### Тест
1. Что такое компонент в React?
2. Зачем нужен `useState` — что будет если хранить данные в обычной переменной?
3. Что такое Virtual DOM и зачем он нужен?
4. Когда вызывается `useEffect`?
5. Чем React отличается от обычного HTML + JavaScript?

---

## День 6 — Vite

### Что это
Vite — инструмент сборки фронтенд проектов. Запускает сервер разработки и собирает продакшн билд.

### Зачем это вообще нужно (в мире)
Браузеры не понимают TypeScript, JSX, современный синтаксис ES2023. Нужен инструмент который:
- Трансформирует TS → JS
- Трансформирует JSX → JS
- Объединяет сотни файлов в несколько бандлов
- Минифицирует код (уменьшает размер)
- Оптимизирует изображения

**Раньше использовали Webpack** — медленный. Большой проект запускался 60+ секунд.
**Vite** (с французского "быстро") — использует нативные ES modules в браузере + esbuild (написан на Go). Запуск за < 1 секунды.

### Как устроено

**vite.config.ts** — конфигурация:
```typescript
export default defineConfig({
  plugins: [
    react(),           // поддержка JSX
    VitePWA({...})    // генерация Service Worker
  ],
  build: {
    outDir: 'dist',   // папка для билда
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],  // отдельный чанк для React
        }
      }
    }
  }
})
```

**Режим разработки:**
- Vite запускает dev-сервер с HMR (Hot Module Replacement)
- Изменил компонент → браузер обновил только его, без полной перезагрузки
- Моментальная реакция

**Продакшн билд (`npm run build`):**
- Tree shaking — удаляет неиспользуемый код
- Code splitting — разбивает код на чанки (загружаются по мере надобности)
- Hashing — `index-dUYDRQYd.js` — хэш в имени файла для кэширования

**Хэширование файлов** — ключевая концепция:
- `index-dUYDRQYd.js` — при изменении кода хэш меняется
- Браузер может кэшировать файл с этим хэшем на год (immutable)
- При новом деплое — новый хэш → браузер скачивает свежий файл

### В нашем проекте
После `npm run build` в папке `dist/` появляются:
```
dist/
├── index.html          # HTML с ссылками на хэшированные файлы
├── sw.js               # Service Worker
├── manifest.webmanifest
└── assets/
    ├── index-dUYDRQYd.js      # главный бандл
    ├── react-vendor-QT1tHJpf.js  # React отдельно (кэшируется дольше)
    ├── motion-Dq7ipaFO.js     # Framer Motion отдельно
    ├── calm-DhxHw_Tp.webp     # изображения с хэшем
    └── index-B92ZmTf-.css     # стили
```

### Практика
1. Создай React+Vite проект: `npm create vite@latest my-app -- --template react-ts`
2. Запусти `npm install && npm run dev`
3. Открой в браузере — увидишь счётчик
4. Измени текст в `App.tsx` — посмотри как страница обновляется без перезагрузки
5. Запусти `npm run build` — посмотри что появилось в папке `dist/`

### Тест
1. Зачем нужен инструмент сборки если браузеры и так понимают JavaScript?
2. Что такое HMR и зачем он нужен разработчику?
3. Почему у файлов в `dist/assets/` есть хэш в имени?
4. Что такое tree shaking?
5. Объясни зачем React выносят в отдельный чанк `react-vendor`.

---

## День 7 — Tailwind CSS

### Что это
Tailwind CSS — utility-first CSS фреймворк. Набор маленьких CSS классов которые описывают конкретные стили.

### Зачем это вообще нужно (в мире)
Обычно пишешь CSS так:
```css
.card {
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

С Tailwind:
```html
<div class="p-4 bg-white rounded-lg shadow-md">
```

**Преимущества:**
- Не нужно придумывать названия классов
- Стили прямо в HTML — видно что как выглядит
- Не растёт в размере — включаются только используемые классы
- Единая дизайн-система (отступы, цвета, шрифты — всё согласовано)

**Популярен в:** большинстве современных React/Vue проектов.

### Как устроено

**Классы:**
```html
<!-- Отступы -->
p-4    → padding: 16px
px-4   → padding-left/right: 16px
py-2   → padding-top/bottom: 8px
m-4    → margin: 16px

<!-- Размеры -->
w-full   → width: 100%
w-1/2    → width: 50%
h-screen → height: 100vh
h-[200px] → height: 200px (произвольное значение)

<!-- Цвета -->
bg-white        → background: white
text-gray-600   → color: серый
border-blue-500 → border-color: синий

<!-- Flexbox -->
flex            → display: flex
items-center    → align-items: center
justify-between → justify-content: space-between
gap-4           → gap: 16px

<!-- Адаптивность -->
md:flex         → flex только на >= 768px
lg:text-xl      → большой текст только на >= 1024px
landscape:h-[140px] → высота 140px в горизонтальной ориентации
```

**tailwind.config.ts** — кастомизация:
```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: '#006a65',    // кастомный цвет
        secondary: '#2FA7A0',
      }
    }
  }
}
```

### В нашем проекте
Дизайн-система Zen-Emerald: `primary: #006a65`, `secondary: #2FA7A0`, фон `#fcf9f4`.

Важное правило проекта: для мобильного landscape-режима использовать только `landscape:` модификатор, никаких `md:` или `lg:` (они для планшетов/десктопов).

**Пример из HomePage:**
```tsx
<section className="w-full h-[200px] landscape:h-[140px] rounded-lg overflow-hidden relative">
  {/* На телефоне высота 200px, в горизонтальной ориентации — 140px */}
```

### Практика
На play.tailwindcss.com:
1. Создай карточку: белый фон, скруглённые углы, тень, отступ внутри
2. Добавь заголовок и текст с разными размерами
3. Сделай кнопку зелёного цвета с белым текстом
4. Сделай так чтобы на маленьких экранах карточки стояли в колонку, а на больших — в ряд

### Тест
1. В чём принципиальное отличие Tailwind от обычного CSS?
2. Что такое `responsive prefix` (`md:`, `lg:`)?
3. Почему в нашем проекте запрещены `md:` и `lg:` для адаптации?
4. Как в Tailwind задать произвольное значение которого нет в системе (например `width: 347px`)?
5. Что такое purge/tree-shaking в контексте Tailwind?

---

## День 8 — Zustand

### Что это
Zustand — библиотека управления состоянием для React. Лёгкая альтернатива Redux.

### Зачем это вообще нужно (в мире)
В React данные передаются от родителя к детям через props. Но если данные нужны в разных частях приложения — возникает проблема:

```
App
├── Header (нужен currentUser)
├── Sidebar (нужен currentUser)
└── ProfilePage (нужен currentUser)
```

Передавать `currentUser` через props в каждый компонент — "prop drilling", это некрасиво.

**Решение — глобальное хранилище состояния.** Zustand создаёт "магазин" данных к которому любой компонент может обратиться напрямую.

**Redux** — старый стандарт, очень многословный. **Zustand** — минималистичный, достаточно мощный.

### Как устроено

```typescript
import { create } from 'zustand'

interface AppStore {
  count: number
  user: User | null
  increment: () => void
  setUser: (user: User) => void
}

const useAppStore = create<AppStore>((set) => ({
  count: 0,
  user: null,
  
  increment: () => set((state) => ({ count: state.count + 1 })),
  setUser: (user) => set({ user }),
}))

// В компоненте:
function Counter() {
  const { count, increment } = useAppStore()
  return <button onClick={increment}>{count}</button>
}
```

**Persist middleware** — сохранять состояние в localStorage:
```typescript
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({ theme: 'light', setTheme: (t) => set({ theme: t }) }),
    { name: 'app-settings' }  // ключ в localStorage
  )
)
```

### В нашем проекте
`src/store/app.store.ts` — центральное хранилище всего приложения.

Хранит:
- `currentMood` — текущее настроение пользователя
- `dailyPack` — гороскоп, поддержка, праздник на сегодня
- `profile` — профиль пользователя (имя, знак зодиака, пол)
- `isLoggedIn`, `accessToken` — данные авторизации

С `persist` — данные сохраняются в localStorage. При обновлении страницы пользователь не вылетает из аккаунта.

### Практика
1. Создай Vite+React проект
2. Установи Zustand: `npm install zustand`
3. Создай хранилище с: списком задач (todos: string[]), функцией добавления и удаления
4. Создай компонент где можно добавлять задачи в input и удалять по клику
5. Добавь persist — обнови страницу, задачи должны сохраниться

### Тест
1. Что такое "prop drilling" и почему это проблема?
2. Чем Zustand отличается от useState?
3. Что делает middleware `persist`?
4. Когда стоит использовать глобальный стор, а когда локальный useState?
5. В нашем проекте при смене настроения на главной что происходит в store?

---

## День 9 — Framer Motion

### Что это
Framer Motion — библиотека анимаций для React.

### Зачем это вообще нужно (в мире)
Анимации делают UI живым и приятным. Без них приложения выглядят "деревянными".

CSS анимации работают хорошо для простых случаев, но сложные переходы (анимация при монтировании/размонтировании компонентов, spring-физика, drag & drop) — с CSS очень сложно.

Framer Motion использует **spring-физику** — анимации ведут себя как в реальном мире (пружина).

### Как устроено

```tsx
import { motion, AnimatePresence } from 'framer-motion'

// Базовая анимация
<motion.div
  initial={{ opacity: 0, y: 20 }}     // начальное состояние
  animate={{ opacity: 1, y: 0 }}      // конечное состояние
  exit={{ opacity: 0, y: -20 }}       // при удалении
  transition={{ duration: 0.3 }}
>
  Привет!
</motion.div>

// AnimatePresence — анимация при добавлении/удалении
<AnimatePresence>
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Модальное окно
    </motion.div>
  )}
</AnimatePresence>

// Variants — переиспользуемые анимации
const variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
}

<motion.div variants={variants} initial="hidden" animate="visible" />
```

### В нашем проекте
Правило проекта: PageLoader анимации — только через Framer Motion, не CSS классы.

Используется для:
- Переходы между страницами (fade in/out)
- Анимация загрузчика
- Появление карточек с контентом

### Практика
На codesandbox.io с установленным framer-motion:
1. Создай карточку которая появляется с fade-in при загрузке
2. Создай кнопку которая показывает/скрывает блок с анимацией
3. Добавь hover-эффект: карточка немного увеличивается при наведении (`whileHover={{ scale: 1.05 }}`)

### Тест
1. Зачем Framer Motion если есть CSS transitions?
2. Что такое `AnimatePresence` и когда его обязательно использовать?
3. Что такое spring-анимация?
4. Чем `initial` отличается от `animate`?
5. Почему в нашем проекте запрещено использовать CSS классы для PageLoader?

---

## День 10 — PWA (Progressive Web App)

### Что это
PWA — веб-приложение которое ведёт себя как нативное мобильное приложение.

### Зачем это вообще нужно (в мире)
**Проблема:** нативное iOS/Android приложение — нужно публиковать в App Store, пользователи должны скачивать, обновлять. Дорого и медленно.

**PWA решает это:** обычный сайт который можно "установить" на телефон. Работает оффлайн, отправляет пуш-уведомления, выглядит как приложение.

**Кто использует:** Twitter, Pinterest, Starbucks, Trivago — все сделали PWA и получили +50-150% конверсии.

### Как устроено

**Три кита PWA:**

1. **HTTPS** — обязательно. PWA работает только на защищённом соединении.

2. **Web App Manifest** (`manifest.webmanifest`) — описание приложения:
```json
{
  "name": "YoYoJoy Day",
  "short_name": "YoYoJoy",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fcf9f4",
  "theme_color": "#006a65",
  "icons": [
    { "src": "/pwa-192x192.png", "sizes": "192x192", "type": "image/png" }
  ]
}
```

3. **Service Worker** — JavaScript файл который работает в фоне:
   - Перехватывает сетевые запросы
   - Кэширует ресурсы → работает оффлайн
   - Получает push-уведомления

**Жизненный цикл Service Worker:**
```
install → activate → fetch (перехват запросов)
```

**Стратегии кэширования:**
- `Cache First` — сначала кэш, потом сеть (для статики)
- `Network First` — сначала сеть, потом кэш (для API)
- `Stale While Revalidate` — отдать кэш, обновить в фоне

### В нашем проекте
Используется `vite-plugin-pwa` с режимом `injectManifest` (наш sw.ts полностью кастомный).

`sw.js` при деплое имеет заголовок `Cache-Control: no-store` — браузер всегда скачивает свежую версию.

Почему это важно: при новом деплое браузер скачивает новый sw.js, видит новый список файлов в precache, обновляет кэш. Пользователи автоматически получают обновления.

### Практика
1. Открой yoyojoy.online в Chrome на компьютере
2. DevTools → Application → Service Workers — посмотри статус
3. DevTools → Application → Cache Storage — посмотри что закэшировано
4. DevTools → Application → Manifest — посмотри иконки и настройки
5. На iPhone: открой Safari → поделиться → "На экран Домой" — установи как приложение

### Тест
1. Чем PWA отличается от нативного приложения?
2. Что такое Service Worker и где он выполняется?
3. Зачем нужен Web App Manifest?
4. Почему PWA требует HTTPS?
5. В нашем проекте sw.js отдаётся с `no-cache`. Объясни зачем — что произойдёт без этого?

---

## День 11 — NestJS

### Что это
NestJS — фреймворк для бэкенда на Node.js. Строгая архитектура, декораторы, модули.

### Зачем это вообще нужно (в мире)
Node.js + Express (популярная связка) — минималистичны. Нет структуры, нет стандартов. У каждого разработчика свой стиль.

**NestJS** привносит структуру вдохновлённую Angular:
- Модули, сервисы, контроллеры — чёткое разделение
- Dependency Injection — сервисы автоматически подключаются
- Декораторы — читаемый, декларативный код
- TypeScript по умолчанию

**Используется в:** крупных backend-проектах где важна поддерживаемость.

### Как устроено

**Три кита NestJS:**

**Controller** — принимает HTTP запросы:
```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }
}
```

**Service** — бизнес-логика:
```typescript
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }
}
```

**Module** — объединяет всё:
```typescript
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

**Guards** — защита роутов (аутентификация):
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user
}
```

### В нашем проекте
Структура бэкенда:
```
backend/src/
├── auth/          # регистрация, вход, OTP, JWT
├── profile/       # профиль пользователя
├── today/         # дневной контент (гороскоп, поддержка, праздник)
├── notifications/ # push-уведомления, CRON
├── ai/            # работа с OpenAI
├── redis/         # кэширование
└── prisma/        # база данных
```

Каждая папка — отдельный модуль NestJS.

### Практика
1. Создай NestJS проект: `npm i -g @nestjs/cli && nest new my-api`
2. Запусти: `npm run start:dev`
3. Открой `localhost:3000` в браузере — "Hello World!"
4. Создай новый контроллер: `nest generate controller cats`
5. Добавь метод который возвращает массив кошек

### Тест
1. Чем NestJS отличается от чистого Express?
2. Что такое Dependency Injection?
3. Зачем нужны Guard'ы?
4. Что такое декоратор `@Injectable()`?
5. Посмотри на наш `profile.service.ts` — какую роль он выполняет?

---

## День 12 — REST API

### Что это
REST API — стандарт проектирования веб-интерфейсов. Способ общения между фронтендом и бэкендом.

### Зачем это вообще нужно (в мире)
Фронтенд (браузер) и бэкенд (сервер) — разные приложения. Им нужен язык общения.

**REST** (Representational State Transfer) — набор правил как строить API:
- Используй HTTP методы по назначению
- URL — это ресурс, не действие
- Бэкенд без состояния (каждый запрос самодостаточен)

**Используется:** везде. Это основа интернета.

### Как устроено

**HTTP методы:**
```
GET    /users        → получить список пользователей
GET    /users/123    → получить пользователя #123
POST   /users        → создать пользователя
PATCH  /users/123    → частично обновить пользователя #123
PUT    /users/123    → полностью заменить пользователя #123
DELETE /users/123    → удалить пользователя #123
```

**HTTP статус-коды:**
```
200 OK              → успех
201 Created         → создано
400 Bad Request     → ошибка в запросе
401 Unauthorized    → не авторизован
403 Forbidden       → нет прав
404 Not Found       → не найдено
500 Internal Error  → ошибка сервера
```

**Пример запроса и ответа:**
```
POST /api/auth/login
Content-Type: application/json

{ "email": "user@mail.com", "password": "123456" }

---

200 OK
{ "accessToken": "eyJhbGci...", "user": { "id": "...", "name": "..." } }
```

**Headers** — метаданные запроса:
```
Authorization: Bearer eyJhbGci...  → токен авторизации
Content-Type: application/json    → тип тела запроса
```

### В нашем проекте
API на `https://api.yoyojoy.online`. Примеры:

```
GET  /api/today          → получить дневной контент
PATCH /api/profile/mood  → сменить настроение
GET  /api/bookmarks      → закладки пользователя
POST /api/auth/register  → регистрация
POST /api/auth/verify-otp → проверка OTP
```

Фронтенд общается с бэком через `apiClient` (axios/fetch wrapper).

### Практика
Используй Postman или браузерный инструмент:
1. Открой `https://jsonplaceholder.typicode.com/posts` — публичный тестовый API
2. Попробуй GET `/posts/1`
3. Попробуй GET `/users`
4. Установи Postman и сделай POST запрос с JSON телом

### Тест
1. Чем POST отличается от PUT? А PUT от PATCH?
2. Что означает статус 401 vs 403?
3. Зачем нужен заголовок Authorization?
4. Что такое "бэкенд без состояния" (stateless)?
5. Почему URL `/api/getUsers` — это плохой REST-дизайн?

---

## День 13 — PostgreSQL

### Что это
PostgreSQL — реляционная база данных. Хранит данные в таблицах со связями между ними.

### Зачем это вообще нужно (в мире)
Приложениям нужно где-то хранить данные между запросами. PostgreSQL — один из самых надёжных и функциональных вариантов.

**Реляционная БД** — данные в таблицах, строгая схема, связи через ключи.
- Подходит для: структурированных данных, транзакций (банки, магазины), сложных запросов

**Альтернативы:** MySQL (похожа), MongoDB (документная, без схемы), SQLite (файловая).

PostgreSQL используют: Instagram, Reddit, Apple, Spotify.

### Как устроено

**Таблицы и схема:**
```sql
CREATE TABLE users (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email     VARCHAR(255) UNIQUE NOT NULL,
  name      VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profiles (
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  birthdate   VARCHAR(10),
  zodiac_sign VARCHAR(20),
  current_mood VARCHAR(50)
);
```

**Основные запросы (SQL):**
```sql
-- Получить всех пользователей
SELECT * FROM users;

-- Получить конкретного
SELECT id, name, email FROM users WHERE id = '123';

-- Вставить
INSERT INTO users (email, name) VALUES ('user@mail.com', 'Иван');

-- Обновить
UPDATE users SET name = 'Пётр' WHERE id = '123';

-- Удалить
DELETE FROM users WHERE id = '123';

-- JOIN — объединить таблицы
SELECT u.name, p.zodiac_sign
FROM users u
JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'user@mail.com';
```

**Индексы** — ускоряют поиск:
```sql
CREATE INDEX idx_users_email ON users(email);
-- Теперь поиск по email в миллионной таблице — мгновенный
```

**Транзакции** — атомарность операций:
```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- или ROLLBACK если что-то пошло не так
```

### В нашем проекте
Таблицы (правило: все в snake_case):
- `users` — email, name, created_at
- `profiles` — zodiac_sign, birthdate, gender, current_mood, avatar_url
- `prefs` — push_time, horoscope_enabled, holidays_enabled, support_enabled
- `daily_feeds` — дневной контент (кэш на день)
- `bookmarks` — закладки пользователей
- `mood_logs` — история смены настроений
- `notifications` — лог отправленных пушей
- `web_push_subscriptions` — подписки на web push

### Практика
1. Зайди на `supabase.com` — бесплатный PostgreSQL в облаке
2. Создай проект
3. В SQL Editor создай таблицу `tasks` с полями id, title, done, created_at
4. Вставь 3 задачи
5. Попробуй SELECT, UPDATE, DELETE

### Тест
1. Чем реляционная база отличается от MongoDB?
2. Что такое PRIMARY KEY и FOREIGN KEY?
3. Зачем нужны индексы?
4. Что такое транзакция? Приведи пример когда без неё нельзя.
5. В нашем проекте почему нельзя использовать PascalCase в SQL запросах?

---

## День 14 — Prisma ORM

### Что это
Prisma — ORM (Object-Relational Mapping) для Node.js/TypeScript. Позволяет работать с базой данных через TypeScript объекты, без написания SQL.

### Зачем это вообще нужно (в мире)
Писать чистый SQL — многословно, легко ошибиться, нет автодополнения.

**ORM** создаёт прослойку: пишешь TypeScript код → ORM генерирует SQL → выполняет в БД.

**Преимущества Prisma:**
- Типобезопасность — TypeScript знает структуру всех таблиц
- Автодополнение — IDE подсказывает поля
- Миграции — управление изменениями схемы
- Читаемый синтаксис

### Как устроено

**schema.prisma** — описание базы данных:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  profile   Profile?
}

model Profile {
  id          String  @id @default(cuid())
  userId      String  @unique
  zodiacSign  String?
  currentMood String?
  user        User    @relation(fields: [userId], references: [id])
}
```

**Запросы (вместо SQL):**
```typescript
// Найти одного
const user = await prisma.user.findUnique({
  where: { email: 'user@mail.com' },
  include: { profile: true }  // подтянуть профиль
})

// Создать
const user = await prisma.user.create({
  data: { email: 'new@mail.com', name: 'Иван' }
})

// Обновить
await prisma.profile.update({
  where: { userId: '123' },
  data: { currentMood: 'Спокойна' }
})

// Upsert — обновить или создать если нет
await prisma.profile.upsert({
  where: { userId: '123' },
  update: { currentMood: 'Радость' },
  create: { userId: '123', currentMood: 'Радость' }
})
```

**Миграции:**
```bash
npx prisma migrate dev --name add-mood-column  # создать миграцию
npx prisma db push                              # применить схему без миграции
npx prisma studio                               # GUI для просмотра данных
```

### В нашем проекте
`backend/prisma/schema.prisma` — вся схема БД.

Из `profile.service.ts`:
```typescript
await this.prisma.profile.upsert({
  where: { userId },
  update: { currentMood: mood },
  create: { userId, currentMood: mood },
})
```
Это atomic операция: если профиль есть — обновить mood, если нет — создать.

### Практика
1. Создай NestJS проект или Node.js проект
2. `npm install prisma @prisma/client`
3. `npx prisma init` — создаст schema.prisma
4. Опиши модели Task и User в schema.prisma
5. `npx prisma db push` (нужна база)
6. Напиши CRUD операции через Prisma Client

### Тест
1. Зачем ORM если можно писать SQL?
2. Что такое миграция?
3. Чем `findUnique` отличается от `findFirst`?
4. Что делает `upsert`?
5. Если в schema.prisma поле называется `zodiacSign`, как оно называется в PostgreSQL?

---

## День 15 — Redis

### Что это
Redis — база данных в памяти (in-memory). Работает как сверхбыстрое хранилище пар ключ-значение.

### Зачем это вообще нужно (в мире)
PostgreSQL хранит данные на диске — запрос занимает 1-50ms.
Redis хранит данные в RAM — запрос занимает 0.1-1ms. В 10-100x быстрее.

**Применения:**
- **Кэширование** — сохранить результат дорогого запроса, отдавать из памяти
- **Сессии** — хранить сессии пользователей
- **Rate limiting** — ограничение частоты запросов
- **Pub/Sub** — очереди сообщений
- **Временные данные** — OTP коды (живут 5 минут)

**Используется:** Twitter (трендинг), GitHub, Stack Overflow, Pinterest.

### Как устроено

**Основные команды:**
```bash
SET user:123 "Иван"         # сохранить строку
GET user:123                 # получить → "Иван"
DEL user:123                 # удалить

SET otp:user@mail.com "1234" EX 300  # с TTL 300 секунд
TTL otp:user@mail.com                # сколько секунд осталось

# Хэши (объекты)
HSET session:abc123 userId "456" role "admin"
HGET session:abc123 userId

# Списки
LPUSH queue:emails "msg1"
RPOP queue:emails
```

**TTL (Time To Live)** — ключевая фишка. Данные автоматически удаляются через N секунд. Идеально для кэша, OTP, сессий.

### В нашем проекте
Redis используется для:

1. **Кэш AI ответов** (TTL 24 часа):
```
Ключ: today:response:{userId}:{date}
Значение: JSON с гороскопом, поддержкой, праздником
```
Генерировать гороскоп через OpenAI стоит денег. Redis кэширует результат на день.

2. **Инвалидация при смене настроения:**
Когда пользователь меняет настроение → Redis ключ удаляется (`redis.del(key)`) → следующий запрос `/api/today` пересобирает контент с новой фразой поддержки.

3. **OTP коды** при регистрации — живут 10 минут, потом автоудаляются.

### Практика
1. Зайди на `try.redis.io` — онлайн Redis
2. Введи: `SET name "Евгений"` → `GET name`
3. Создай ключ с TTL: `SET otp "1234" EX 60`
4. Проверяй `TTL otp` каждые несколько секунд — видишь как уменьшается?
5. Введи `HSET user:1 name "Евгений" city "Москва"` → `HGETALL user:1`

### Тест
1. Чем Redis отличается от PostgreSQL?
2. Когда нельзя заменить PostgreSQL на Redis полностью?
3. Что такое TTL и зачем он нужен?
4. В нашем проекте зачем кэшировать ответы OpenAI?
5. Почему при смене настроения мы инвалидируем кэш Redis а не просто обновляем?

---

## День 16 — Docker

### Что это
Docker — платформа для контейнеризации. Упаковывает приложение со всеми зависимостями в изолированный контейнер.

### Зачем это вообще нужно (в мире)
Классическая проблема: "у меня работает, у тебя нет". Разные версии Node.js, системные библиотеки, конфигурации.

**Docker решает:** одинаковое окружение везде — у разработчика, на тестовом сервере, в продакшне.

**Контейнер** — изолированный процесс со своей файловой системой, сетью, переменными окружения.
**Образ (Image)** — шаблон для создания контейнеров. Неизменяемый.

**Используется:** практически все крупные компании.

### Как устроено

**Dockerfile** — инструкция как собрать образ:
```dockerfile
FROM node:20-alpine          # базовый образ

WORKDIR /app                 # рабочая папка внутри контейнера

COPY package*.json ./
RUN npm ci --only=production # установить зависимости

COPY . .
RUN npm run build            # собрать

EXPOSE 4000                  # порт
CMD ["node", "dist/main.js"] # команда запуска
```

**docker-compose.yml** — запустить несколько контейнеров вместе:
```yaml
services:
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://...
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

**Основные команды:**
```bash
docker build -t my-app .           # собрать образ
docker run -p 4000:4000 my-app     # запустить контейнер
docker ps                          # список запущенных
docker logs container_name         # логи
docker exec -it container_name sh  # войти внутрь

docker compose up -d               # запустить все сервисы в фоне
docker compose down                # остановить
docker compose logs api            # логи сервиса api
```

### В нашем проекте
На VPS запущены 3 контейнера через docker-compose.prod.yml:
- `yoyojoy-backend-api-1` — NestJS API на порту 4000
- `yoyojoy-backend-db-1` — PostgreSQL 15
- `yoyojoy-backend-redis-1` — Redis 7

Деплой бэкенда:
```bash
docker compose -f docker-compose.prod.yml build api  # пересобрать образ
docker compose -f docker-compose.prod.yml up -d api  # перезапустить
```

### Практика
1. Установи Docker Desktop с docker.com
2. Запусти: `docker run -p 80:80 nginx` — запустит nginx сервер
3. Открой `localhost` в браузере
4. `docker ps` — посмотри запущенные контейнеры
5. `docker logs <id>` — посмотри логи
6. Ctrl+C и `docker stop <id>`

### Тест
1. Чем контейнер отличается от виртуальной машины?
2. Зачем нужен docker-compose?
3. Что такое volume в Docker?
4. Почему `depends_on: db` важно для нашего api сервиса?
5. Что произойдёт с данными PostgreSQL если удалить контейнер без volume?

---

## День 17 — Nginx

### Что это
Nginx — веб-сервер и обратный прокси. Принимает HTTP запросы и решает что с ними делать.

### Зачем это вообще нужно (в мире)
**Веб-сервер** — отдаёт статические файлы (HTML, JS, CSS, картинки).
**Обратный прокси** — принимает запросы и перенаправляет их на бэкенд сервисы.

**Зачем нужен прокси перед Node.js:**
- Node.js не оптимален для отдачи статики
- Nginx умеет gzip, кэширование заголовков, SSL termination
- Безопасность — Node.js не слушает напрямую 80/443 порт
- Балансировка нагрузки между несколькими Node.js процессами

**Используется:** 34% всех веб-серверов мира.

### Как устроено

**Основная конфигурация:**
```nginx
server {
    listen 443 ssl;
    server_name yoyojoy.online;

    # SSL сертификаты (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yoyojoy.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yoyojoy.online/privkey.pem;

    # Отдавать статику
    root /var/www/yoyojoy-frontend/dist;
    index index.html;

    # SPA routing — все 404 отдавать index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Агрессивный кэш для хэшированных файлов
    location ~* \.(js|css|webp|png)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Обратный прокси для API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
    }
}
```

**Ключевые директивы:**
- `root` — папка со статическими файлами
- `try_files` — SPA routing: пробует файл → папку → fallback
- `proxy_pass` — перенаправить запрос на другой сервер
- `expires 1y` — кэш на 1 год

**Перезагрузка:**
```bash
nginx -s reload    # мягкая перезагрузка без даунтайма
nginx -t           # проверить конфигурацию на ошибки
```

### В нашем проекте
На VPS два конфига в `/etc/nginx/sites-enabled/`:
1. `api.yoyojoy.online` → proxy_pass на порт 4000 (Docker контейнер)
2. `yoyojoy.online` → root `/var/www/yoyojoy-frontend/dist` + SPA routing

**`try_files $uri $uri/ /index.html`** — критично для React SPA. Когда пользователь открывает `yoyojoy.online/profile` — файла `/profile` нет на диске. Без этой строки nginx вернул бы 404. С ней — отдаёт index.html, React Router разбирается с маршрутом.

### Практика
1. Установи WSL (Windows Subsystem for Linux) или используй VPS
2. `sudo apt install nginx`
3. Посмотри конфиг: `cat /etc/nginx/nginx.conf`
4. Зайди на `localhost` — увидишь дефолтную страницу nginx
5. Измени `/var/www/html/index.html` — посмотри результат

### Тест
1. Чем nginx отличается от Node.js в контексте работы с HTTP?
2. Зачем нужен `try_files $uri $uri/ /index.html` для React SPA?
3. Что такое SSL termination?
4. Почему файлы с хэшем в имени можно кэшировать на 1 год?
5. Что происходит когда ты вводишь `nginx -s reload`?

---

## День 18 — JWT & Аутентификация

### Что это
JWT (JSON Web Token) — стандарт передачи данных аутентификации в виде подписанного токена.

### Зачем это вообще нужно (в мире)
HTTP — stateless протокол. Сервер не помнит кто ты между запросами.

**Сессии (старый способ):**
1. Пользователь логинится → сервер создаёт сессию в БД → даёт куки с session_id
2. При каждом запросе → проверка session_id в БД
3. Проблема: не масштабируется, нагрузка на БД

**JWT (современный способ):**
1. Пользователь логинится → сервер создаёт подписанный токен → возвращает клиенту
2. Клиент хранит токен, отправляет с каждым запросом
3. Сервер проверяет подпись (без запроса в БД) — быстро и масштабируется

### Как устроено

**Структура JWT:**
```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMifQ.abc123
      Header              Payload               Signature
```

- **Header** — алгоритм подписи (base64)
- **Payload** — данные (base64, НЕ шифрование!): userId, роль, время истечения
- **Signature** — HMAC подпись с секретным ключом

**Важно:** Payload можно декодировать без ключа. JWT не для хранения секретов, только для верификации.

**Access + Refresh токены:**
```
Access Token  — короткий срок (15 мин - 1 час). Используется для запросов.
Refresh Token — длинный срок (30-365 дней). Используется только для получения нового Access.
```

При истечении Access Token — клиент незаметно запрашивает новый через Refresh.

**OTP (One-Time Password):**
```
Регистрация → сервер генерирует 4-значный код → отправляет на email
Пользователь вводит код → сервер проверяет → создаёт аккаунт
```

### В нашем проекте
Flow аутентификации:
1. `POST /api/auth/register` → email → сервер отправляет OTP на почту
2. `POST /api/auth/verify-otp` → OTP код → сервер создаёт аккаунт → возвращает `accessToken` + `refreshToken`
3. Все защищённые запросы: `Authorization: Bearer <accessToken>`
4. При 401 → фронт автоматически делает `POST /api/auth/refresh` с `refreshToken`

Тестовый аккаунт: OTP всегда `1111` для `mukaniskander01@gmail.com`.
Refresh token у тестового аккаунта — 365 дней (для удобства тестирования).

### Практика
1. Зайди на `jwt.io`
2. Вставь любой JWT токен из нашего приложения (из DevTools → Network)
3. Посмотри что внутри Payload
4. Попробуй изменить Payload — подпись станет невалидной

### Тест
1. Почему JWT не нужно хранить в БД для верификации?
2. Зачем два токена (access + refresh) вместо одного долгоживущего?
3. Является ли JWT шифрованием?
4. Что такое OTP и зачем он нужен при регистрации?
5. Что произойдёт если злоумышленник украдёт access token? И refresh token?

---

## День 19 — OpenAI API

### Что это
OpenAI API — программный интерфейс для работы с языковыми моделями GPT.

### Зачем это вообще нужно (в мире)
ChatGPT — это веб-интерфейс. API позволяет встроить те же возможности в своё приложение:
- Генерация текста
- Анализ и классификация
- Перевод
- Код-ревью
- И многое другое

**Используется:** тысячи продуктов — от чат-ботов до генераторов контента.

### Как устроено

**Базовый запрос:**
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'Ты помощник-астролог.' },
    { role: 'user', content: 'Дай гороскоп для Козерога на сегодня.' }
  ],
  temperature: 0.7,   // 0 = детерминированный, 1 = творческий
  max_tokens: 200,
})

const text = response.choices[0].message.content
```

**Structured Outputs** — ответ строго в JSON:
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'horoscope',
      schema: {
        type: 'object',
        properties: {
          main: { type: 'string' },
          advice: { type: 'string' }
        }
      }
    }
  }
})
```

**Ценообразование:** платишь за токены (≈ 4 символа). Input tokens + Output tokens.

**Кэширование обязательно** — запросы стоят денег.

### В нашем проекте
Используется для генерации:
- Гороскопа по знаку зодиака
- Фразы поддержки по настроению, знаку, имени, полу

**Mock Fallback Mode:** если ключ не настроен или API упал — бэкенд возвращает заготовленные фразы из словаря. Приложение не падает.

**Кэш в Redis:** ключ `today:response:{userId}:{date}`, TTL 24 часа. Один пользователь = один запрос к OpenAI в день.

Клиент пополнил $12.70 на OpenAI — хватит на тысячи дней работы с gpt-4o-mini.

### Практика
1. Зарегистрируйся на platform.openai.com
2. Создай API ключ
3. В терминале: `curl https://api.openai.com/v1/chat/completions -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Привет!"}]}'`
4. Посмотри ответ

### Тест
1. Зачем кэшировать ответы OpenAI в Redis?
2. Что такое `temperature` в запросе?
3. Почему API ключ НИКОГДА нельзя в фронтенд код?
4. Что такое Structured Outputs?
5. В нашем проекте что происходит если OpenAI API недоступен?

---

## День 20 — Web Push уведомления

### Что это
Web Push — стандарт браузерных push-уведомлений. Позволяет сайту отправлять уведомления пользователю даже когда он закрыл браузер.

### Зачем это вообще нужно (в мире)
Push-уведомления — мощный канал коммуникации с пользователем. Напоминание, новость, акция — без email и SMS.

**Web Push** работает через браузерные Push серверы (Google FCM для Chrome, Mozilla для Firefox, Apple для Safari).

### Как устроено

**Схема работы:**
```
1. Пользователь даёт разрешение в браузере
2. Браузер создаёт подписку (endpoint URL + ключи)
3. Фронтенд отправляет подписку на наш сервер
4. Сервер хранит подписку в БД
5. При необходимости → сервер отправляет push через VAPID

Пользователь получает уведомление даже при закрытом браузере!
```

**VAPID ключи** — пара публичный/приватный ключ для подписи push-сообщений. Идентифицируют сервер.

**Service Worker получает пуш:**
```javascript
// sw.ts
self.addEventListener('push', (event) => {
  const data = event.data.json()
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/pwa-192x192.png',
    data: { url: data.data.url }
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  clients.openWindow(event.notification.data.url)
})
```

### В нашем проекте
**CRON задача** каждую минуту проверяет:
- Есть ли пользователи у которых `push_time` = текущее UTC время
- Если да → получает их dailyPack → отправляет пуш через Web Push

Содержимое пуша зависит от настроек пользователя:
- `horoscopeEnabled: true` → пуш с гороскопом
- `holidaysEnabled: true` → пуш с праздником
- `supportEnabled: true` → пуш с фразой поддержки

Пользователь может настроить время в Настройках приложения.

**Ключевое правило:** вся логика расписания на сервере (CRON). Фронтенд только передаёт endpoint подписки и `push_time`.

### Практика
1. Открой yoyojoy.online
2. В Настройках — разреши уведомления
3. Посмотри в DevTools → Application → Push Messaging
4. Установи время уведомлений на ближайшую минуту и жди пуш

### Тест
1. Чем Web Push отличается от SMS?
2. Зачем нужны VAPID ключи?
3. Где выполняется код получения push-уведомления?
4. Почему логика расписания должна быть на сервере, а не в браузере?
5. Что произойдёт если пользователь отозвал разрешение на уведомления?

---

## Финальный тест (после всех 20 дней)

Ответь на эти вопросы — это проверка всего курса:

1. Опиши полный путь запроса: пользователь открывает yoyojoy.online → что происходит технически до момента когда он видит свой гороскоп?

2. Почему Redis стоит перед OpenAI в нашей архитектуре? Что произойдёт если Redis упадёт?

3. Объясни почему нельзя хранить OpenAI ключ в React коде.

4. Пользователь меняет настроение с "Нормально" на "Спокойна". Опиши что происходит: фронтенд → API → база → Redis → ответ.

5. Мы задеплоили новую версию. Пользователь не видит изменений. Назови 3 возможные причины и как их починить.

6. Нарисуй схему нашей архитектуры (текстом): браузер → Nginx → (что куда идёт) → Docker контейнеры → базы данных.

---

*Удачи! Главное — не торопиться. Один день = один инструмент = крепкая база.*
