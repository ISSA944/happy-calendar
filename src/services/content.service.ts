// ─── Content Service ─────────────────────────────────────────
// Static UI helpers: mood images, labels, date formatting, holiday lookup.
// Horoscope text and support phrases come from the backend (GET /api/today).

// ══════════ MOOD IMAGES (Unsplash) ══════════
// Ключи — женские формы (база в БД). Мужские формы преобразуются через MOOD_LABELS_M.
export const MOOD_IMAGES: Record<string, string> = {
  'Спокойна':     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop&q=80',
  'Нормально':    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=400&fit=crop&q=80',
  'Устала':       'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&h=400&fit=crop&q=80',
  'Тревожна':     'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=400&fit=crop&q=80',
  'Грустна':      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&h=400&fit=crop&q=80',
  'Воодушевлена': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&q=80',
}

// ══════════ HOLIDAY CALENDAR ══════════
interface Holiday {
  name: string
  description: string
  icon: string
}

// Key: "DD.MM" — российский календарь праздников + международные дни
export const HOLIDAYS: Record<string, Holiday> = {
  // ── ЯНВАРЬ ──
  '01.01': { name: 'Новый год', description: 'Пусть каждый день нового года приносит радость.', icon: 'celebration' },
  '02.01': { name: 'Новогодние каникулы', description: 'Время отдыха, тепла и близких людей.', icon: 'weekend' },
  '03.01': { name: 'Новогодние каникулы', description: 'Наслаждайся зимним волшебством.', icon: 'ac_unit' },
  '04.01': { name: 'Новогодние каникулы', description: 'Уют, чай и хорошие фильмы.', icon: 'local_cafe' },
  '05.01': { name: 'Новогодние каникулы', description: 'Самое время гулять и дышать морозным воздухом.', icon: 'nature_people' },
  '06.01': { name: 'Рождественский сочельник', description: 'Вечер тишины и ожидания чуда.', icon: 'nights_stay' },
  '07.01': { name: 'Рождество Христово', description: 'Время чудес, тепла и близких.', icon: 'church' },
  '08.01': { name: 'Новогодние каникулы', description: 'Последние дни праздничного покоя.', icon: 'self_improvement' },
  '11.01': { name: 'День заповедников', description: 'Берегите природу — она бесценна.', icon: 'forest' },
  '13.01': { name: 'Старый Новый год', description: 'Ещё один шанс загадать желание!', icon: 'auto_awesome' },
  '14.01': { name: 'День зимних видов спорта', description: 'Лыжи, коньки, сноуборд — движение это жизнь!', icon: 'downhill_skiing' },
  '21.01': { name: 'День объятий', description: 'Обними тех, кто тебе дорог.', icon: 'volunteer_activism' },
  '25.01': { name: 'День студента (Татьянин день)', description: 'Всех студентов — с праздником!', icon: 'school' },
  '27.01': { name: 'День снятия блокады Ленинграда', description: 'Память, которая живёт в каждом из нас.', icon: 'candle' },

  // ── ФЕВРАЛЬ ──
  '02.02': { name: 'День сурка', description: 'Скоро ли весна? Сурок знает ответ!', icon: 'pets' },
  '08.02': { name: 'День российской науки', description: 'Наука — двигатель прогресса.', icon: 'science' },
  '10.02': { name: 'День домового', description: 'Не забудь оставить угощение!', icon: 'home' },
  '14.02': { name: 'День Святого Валентина', description: 'Любовь повсюду — в каждом жесте и слове.', icon: 'favorite' },
  '17.02': { name: 'День спонтанного проявления доброты', description: 'Сделай что-то доброе без причины.', icon: 'emoji_emotions' },
  '21.02': { name: 'Международный день родного языка', description: 'Великий и могучий русский язык!', icon: 'translate' },
  '23.02': { name: 'День Защитника Отечества', description: 'Честь и мужество — основа силы.', icon: 'military_tech' },

  // ── МАРТ ──
  '01.03': { name: 'Первый день весны', description: 'Весна пришла — природа просыпается!', icon: 'local_florist' },
  '03.03': { name: 'Всемирный день писателя', description: 'Книги меняют мир. Прочитай что-то новое.', icon: 'menu_book' },
  '08.03': { name: 'Международный женский день', description: 'Сияй и будь счастлива в этот день.', icon: 'local_florist' },
  '09.03': { name: 'День ди-джея', description: 'Музыка объединяет людей!', icon: 'headphones' },
  '14.03': { name: 'День числа Пи', description: '3.14... — математика бывает вкусной!', icon: 'calculate' },
  '18.03': { name: 'День воссоединения Крыма', description: 'Вместе — сильнее.', icon: 'flag' },
  '20.03': { name: 'День счастья', description: 'Счастье — это то, что ты создаёшь сам.', icon: 'sentiment_very_satisfied' },
  '21.03': { name: 'Всемирный день поэзии', description: 'Стихи — это музыка души.', icon: 'edit_note' },
  '22.03': { name: 'Всемирный день воды', description: 'Вода — источник жизни. Береги её.', icon: 'water_drop' },
  '27.03': { name: 'Международный день театра', description: 'Весь мир — театр, а люди — актёры.', icon: 'theater_comedy' },

  // ── АПРЕЛЬ ──
  '01.04': { name: 'День смеха', description: 'Улыбайся — сегодня можно всё!', icon: 'mood' },
  '02.04': { name: 'День детской книги', description: 'Читай детям — это лучший подарок.', icon: 'auto_stories' },
  '06.04': { name: 'День мультфильмов', description: 'Мультики — для всех возрастов!', icon: 'smart_display' },
  '07.04': { name: 'Всемирный день здоровья', description: 'Здоровье — главное богатство.', icon: 'health_and_safety' },
  '12.04': { name: 'День космонавтики', description: 'Мечтай о звёздах — они ближе, чем кажется.', icon: 'rocket_launch' },
  '15.04': { name: 'День экологических знаний', description: 'Каждый может сделать мир чище.', icon: 'eco' },
  '16.04': { name: 'День голоса', description: 'Твой голос имеет значение.', icon: 'mic' },
  '18.04': { name: 'День памятников', description: 'Хранить историю — значит уважать будущее.', icon: 'account_balance' },
  '22.04': { name: 'День Земли', description: 'Наша планета — наш дом. Береги её.', icon: 'public' },
  '23.04': { name: 'Всемирный день книги', description: 'Хорошая книга — лучший друг.', icon: 'menu_book' },
  '26.04': { name: 'День памяти Чернобыля', description: 'Помним ради будущего.', icon: 'candle' },
  '28.04': { name: 'День химической безопасности', description: 'Безопасность начинается с осознанности.', icon: 'science' },
  '29.04': { name: 'Международный день танца', description: 'Танцуй — неважно, смотрят ли на тебя!', icon: 'music_note' },
  '30.04': { name: 'День пожарной охраны', description: 'Спасибо тем, кто спасает жизни.', icon: 'local_fire_department' },

  // ── МАЙ ──
  '01.05': { name: 'Праздник Весны и Труда', description: 'Весна цветёт, а труд рождает мечты.', icon: 'park' },
  '03.05': { name: 'День Солнца', description: 'Пусть в твоей жизни всегда будет свет.', icon: 'wb_sunny' },
  '05.05': { name: 'День шифровальщика', description: 'Секреты хранят те, кому доверяют.', icon: 'lock' },
  '07.05': { name: 'День радио', description: 'Связь — основа цивилизации.', icon: 'radio' },
  '09.05': { name: 'День Победы', description: 'Помним. Гордимся. Чтим.', icon: 'star' },
  '13.05': { name: 'День одуванчика', description: 'Загадай желание и подуй!', icon: 'local_florist' },
  '15.05': { name: 'Международный день семьи', description: 'Семья — самое ценное в жизни.', icon: 'family_restroom' },
  '18.05': { name: 'День музеев', description: 'Искусство вдохновляет и исцеляет.', icon: 'museum' },
  '24.05': { name: 'День славянской письменности', description: 'Благодаря Кириллу и Мефодию мы пишем.', icon: 'history_edu' },
  '27.05': { name: 'День библиотек', description: 'Библиотека — храм знаний.', icon: 'local_library' },
  '31.05': { name: 'День блондинок', description: 'Блондинки правят миром!', icon: 'face' },

  // ── ИЮНЬ ──
  '01.06': { name: 'День защиты детей', description: 'Каждый ребёнок заслуживает счастливое детство.', icon: 'child_care' },
  '05.06': { name: 'День эколога', description: 'Забота о природе — забота о себе.', icon: 'eco' },
  '06.06': { name: 'День русского языка (Пушкинский день)', description: 'Наш язык — наше сокровище.', icon: 'history_edu' },
  '08.06': { name: 'День океанов', description: 'Океан хранит тайны всей планеты.', icon: 'water' },
  '09.06': { name: 'День друзей', description: 'Настоящие друзья — это навсегда.', icon: 'group' },
  '12.06': { name: 'День России', description: 'Сила страны — в её людях.', icon: 'flag' },
  '22.06': { name: 'День памяти и скорби', description: 'Мы помним 22 июня 1941 года.', icon: 'candle' },
  '25.06': { name: 'День дружбы народов', description: 'В единстве наша сила.', icon: 'diversity_3' },
  '27.06': { name: 'День молодёжи', description: 'Молодость — время возможностей!', icon: 'emoji_people' },

  // ── ИЮЛЬ ──
  '02.07': { name: 'День спортивного журналиста', description: 'Спорт — это эмоции, о которых рассказывают лучшие.', icon: 'sports' },
  '08.07': { name: 'День семьи, любви и верности', description: 'Любовь и верность — вечные ценности.', icon: 'family_restroom' },
  '11.07': { name: 'День шоколада', description: 'Шоколад делает мир лучше!', icon: 'cake' },
  '17.07': { name: 'День эмодзи', description: 'Иногда одна рожица стоит тысячи слов.', icon: 'emoji_emotions' },
  '20.07': { name: 'Международный день шахмат', description: 'Шахматы — гимнастика для ума.', icon: 'extension' },
  '23.07': { name: 'Всемирный день китов и дельфинов', description: 'Защитим обитателей океана.', icon: 'water' },
  '28.07': { name: 'День крещения Руси', description: 'Духовные истоки нашей культуры.', icon: 'church' },
  '30.07': { name: 'День дружбы', description: 'Обними друга — сегодня его день!', icon: 'handshake' },

  // ── АВГУСТ ──
  '01.08': { name: 'День ТикТока', description: 'Сними что-нибудь весёлое!', icon: 'videocam' },
  '02.08': { name: 'День ВДВ', description: 'Слава воздушному десанту!', icon: 'flight' },
  '05.08': { name: 'День светофора', description: 'Зелёный свет — впереди только хорошее!', icon: 'traffic' },
  '08.08': { name: 'День кошек', description: 'Мурлыканье — лучшая терапия.', icon: 'pets' },
  '12.08': { name: 'День молодёжи', description: 'Будущее принадлежит тем, кто мечтает.', icon: 'emoji_people' },
  '13.08': { name: 'День левшей', description: 'Левши видят мир по-своему — и это прекрасно!', icon: 'back_hand' },
  '19.08': { name: 'День фотографии', description: 'Один кадр — тысяча историй.', icon: 'photo_camera' },
  '22.08': { name: 'День флага России', description: 'Белый, синий, красный — наши цвета.', icon: 'flag' },
  '26.08': { name: 'День кино', description: 'Хороший фильм — лучший вечер.', icon: 'movie' },
  '27.08': { name: 'День российского кино', description: 'Наше кино — наша гордость.', icon: 'theaters' },

  // ── СЕНТЯБРЬ ──
  '01.09': { name: 'День знаний', description: 'Учиться — значит расти.', icon: 'school' },
  '03.09': { name: 'День солидарности в борьбе с терроризмом', description: 'Мир и безопасность для всех.', icon: 'candle' },
  '08.09': { name: 'Международный день грамотности', description: 'Грамотность открывает двери в мир.', icon: 'spellcheck' },
  '09.09': { name: 'День тестировщика', description: 'Баги боятся тебя!', icon: 'bug_report' },
  '13.09': { name: 'День программиста', description: 'Код — это поэзия для машин.', icon: 'code' },
  '21.09': { name: 'Международный день мира', description: 'Мир начинается с каждого из нас.', icon: 'peace' },
  '27.09': { name: 'День воспитателя', description: 'Спасибо тем, кто растит будущее.', icon: 'child_care' },
  '28.09': { name: 'День интернета в России', description: 'Интернет изменил всё.', icon: 'language' },
  '30.09': { name: 'День переводчика', description: 'Мосты между культурами строят переводчики.', icon: 'translate' },

  // ── ОКТЯБРЬ ──
  '01.10': { name: 'День музыки', description: 'Музыка — универсальный язык.', icon: 'music_note' },
  '04.10': { name: 'День защиты животных', description: 'Будь добр к братьям нашим меньшим.', icon: 'pets' },
  '05.10': { name: 'День учителя', description: 'Спасибо тем, кто зажигает свет знаний.', icon: 'menu_book' },
  '10.10': { name: 'День психического здоровья', description: 'Заботься о своём внутреннем мире.', icon: 'self_improvement' },
  '14.10': { name: 'Покров Пресвятой Богородицы', description: 'День веры и тепла.', icon: 'church' },
  '16.10': { name: 'День хлеба', description: 'Хлеб — всему голова.', icon: 'bakery_dining' },
  '20.10': { name: 'День повара', description: 'Вкусная еда делает людей счастливее.', icon: 'restaurant' },
  '25.10': { name: 'День оперы', description: 'Искусство, которое трогает душу.', icon: 'theater_comedy' },
  '28.10': { name: 'День бабушек и дедушек', description: 'Самые мудрые и любящие люди в мире.', icon: 'elderly' },
  '31.10': { name: 'Хэллоуин', description: 'Время сладостей и весёлых костюмов!', icon: 'celebration' },

  // ── НОЯБРЬ ──
  '03.11': { name: 'День милиции / полиции', description: 'Тем, кто стоит на страже закона.', icon: 'local_police' },
  '04.11': { name: 'День народного единства', description: 'Вместе мы — сила.', icon: 'groups' },
  '10.11': { name: 'День науки', description: 'Наука делает невозможное возможным.', icon: 'science' },
  '13.11': { name: 'Всемирный день доброты', description: 'Одно доброе дело меняет чей-то день.', icon: 'volunteer_activism' },
  '16.11': { name: 'День толерантности', description: 'Уважай различия — они делают мир богаче.', icon: 'diversity_3' },
  '18.11': { name: 'День рождения Деда Мороза', description: 'Скоро волшебство начнётся!', icon: 'ac_unit' },
  '21.11': { name: 'Всемирный день телевидения', description: 'ТВ или стриминг — главное, вместе!', icon: 'tv' },
  '26.11': { name: 'День матери', description: 'Мама — самый важный человек.', icon: 'favorite' },
  '30.11': { name: 'День домашних животных', description: 'Пушистые друзья заслуживают праздник.', icon: 'pets' },

  // ── ДЕКАБРЬ ──
  '01.12': { name: 'Всемирный день борьбы со СПИДом', description: 'Осведомлённость спасает жизни.', icon: 'health_and_safety' },
  '03.12': { name: 'День инвалидов', description: 'Каждый человек заслуживает уважения.', icon: 'accessibility' },
  '04.12': { name: 'День информатики', description: 'Технологии меняют мир.', icon: 'computer' },
  '05.12': { name: 'День волонтёра', description: 'Помогать другим — лучшее, что можно делать.', icon: 'volunteer_activism' },
  '09.12': { name: 'День героев Отечества', description: 'Помним подвиги настоящих героев.', icon: 'military_tech' },
  '10.12': { name: 'День прав человека', description: 'Права каждого — ценность для всех.', icon: 'balance' },
  '12.12': { name: 'День Конституции', description: 'Основной закон нашей страны.', icon: 'gavel' },
  '15.12': { name: 'День чая', description: 'Согревающий напиток для тёплых бесед.', icon: 'local_cafe' },
  '20.12': { name: 'День ФСБ', description: 'На страже безопасности.', icon: 'shield' },
  '22.12': { name: 'Зимнее солнцестояние', description: 'Самая длинная ночь — а значит, свет прибавляется!', icon: 'dark_mode' },
  '25.12': { name: 'Католическое Рождество', description: 'Merry Christmas! Мир и радость.', icon: 'church' },
  '27.12': { name: 'День спасателя', description: 'Спасибо тем, кто приходит на помощь.', icon: 'emergency' },
  '31.12': { name: 'Канун Нового года', description: 'Загадай желание — оно обязательно сбудется!', icon: 'auto_awesome' },
}

// ══════════ GENDER-AWARE MOOD LABELS ══════════
// Базовые ключи (БД) — женские формы. Мужские формы — через этот словарь.
export const MOOD_LABELS_M: Record<string, string> = {
  'Спокойна':     'Спокоен',
  'Нормально':    'Нормально',
  'Устала':       'Устал',
  'Тревожна':     'Тревожен',
  'Грустна':      'Грустен',
  'Воодушевлена': 'Воодушевлён',
}

export function getMoodLabel(id: string, gender: 'F' | 'M' | 'UNKNOWN'): string {
  if (gender === 'M') return MOOD_LABELS_M[id] ?? id
  return id
}

// ══════════ HELPERS ══════════

function getTodayDateStr(): string {
  const now = new Date()
  return `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getTodayFormatted(): string {
  const now = new Date()
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  return `${now.getDate()} ${months[now.getMonth()]}`
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function getTodayHoliday(): Holiday | null {
  return HOLIDAYS[getTodayDateStr()] ?? null
}

export function getMoodImage(mood: string): string {
  return MOOD_IMAGES[mood] ?? MOOD_IMAGES['Нейтрально']
}

export function getFullDateStr(): string {
  const now = new Date()
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
}
