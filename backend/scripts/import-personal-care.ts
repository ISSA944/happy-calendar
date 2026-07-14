/**
 * Импорт дней заботы из «Личные_праздники_YoYoJoy.xlsx» → seed-data/personal-care-days.json.
 *
 * Запуск:  npx ts-node scripts/import-personal-care.ts
 *
 * Исходный xlsx лежит в backend/data/ (gitignored, клиентский артефакт).
 * Результат — reviewable JSON в prisma/seed-data/personal-care-days.json (коммитится).
 * Заливка в БД — через prisma/seed.ts (npx prisma db seed), upsert по dayOfYear.
 *
 * Колонки листа: A=№(1..365) B=Название дня
 * C/D=🪶 Спокойствие задание/совет  E/F=♥ Слышать себя задание/совет
 * G/H=🍎 Здоровые привычки задание/совет  I/J=〽️ Больше двигаться задание/совет
 * K=Тема фона. Колонки L–M (визуальные ключи/палитра) не нужны — только для генерации картинок.
 *
 * Обращение по имени: в исходных строках плейсхолдера {имя} нет — добавляем его синтетически
 * («{имя}, » + первая буква задания в нижнем регистре), продолжая существующий паттерн контента
 * (см. prisma/seed-data/personal-care-days.json, старый прототипный сид) и рантайм fillName()
 * (src/common/name.util.ts), который без плейсхолдера ничего не подставляет.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { normalizeTheme } from '../src/holidays/themes.constant';

const DATA_DIR = path.resolve(__dirname, '../data');
const OUT = path.resolve(__dirname, '../prisma/seed-data/personal-care-days.json');

/** Ищем xlsx по ключевому слову с учётом Unicode-нормализации (Telegram-имена бывают в NFD). */
function findXlsx(keyword: string): string | null {
  if (!fs.existsSync(DATA_DIR)) return null;
  const kw = keyword.normalize('NFC').toLowerCase();
  const match = fs
    .readdirSync(DATA_DIR)
    .find((f) => f.toLowerCase().endsWith('.xlsx') && f.normalize('NFC').toLowerCase().includes(kw));
  return match ? path.join(DATA_DIR, match) : null;
}

const SRC = findXlsx('личные');

interface PersonalCareDaySeed {
  dayOfYear: number;
  title: string;
  themeKey: string;
  calmTask: string;
  calmAdvice: string;
  hearTask: string;
  hearAdvice: string;
  foodTask: string;
  foodAdvice: string;
  moveTask: string;
  moveAdvice: string;
}

/** «{имя}, » + первая буква в нижнем регистре — как в существующем контенте дней заботы. */
function withNameGreeting(task: string): string {
  const trimmed = task.trim();
  const lower = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return `{имя}, ${lower}`;
}

function main() {
  if (!SRC || !fs.existsSync(SRC)) {
    console.error(`❌ Не найден xlsx личных праздников в backend/data/ (искал по «личные»).`);
    process.exit(1);
  }

  const wb = XLSX.readFile(SRC);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, blankrows: false });

  const out: PersonalCareDaySeed[] = [];
  let skipped = 0;

  // rows[0] — заголовок
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const dayOfYear = Number(r[0]);
    const title = String(r[1] ?? '').trim();
    if (!Number.isInteger(dayOfYear) || dayOfYear <= 0 || !title) {
      skipped++;
      continue;
    }
    out.push({
      dayOfYear,
      title,
      themeKey: normalizeTheme(String(r[10] ?? '')),
      calmTask: withNameGreeting(String(r[2] ?? '').trim()),
      calmAdvice: String(r[3] ?? '').trim(),
      hearTask: withNameGreeting(String(r[4] ?? '').trim()),
      hearAdvice: String(r[5] ?? '').trim(),
      foodTask: withNameGreeting(String(r[6] ?? '').trim()),
      foodAdvice: String(r[7] ?? '').trim(),
      moveTask: withNameGreeting(String(r[8] ?? '').trim()),
      moveAdvice: String(r[9] ?? '').trim(),
    });
  }

  out.sort((a, b) => a.dayOfYear - b.dayOfYear);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');

  console.log(`✅ Импортировано ${out.length} дней заботы (пропущено пустых: ${skipped}).`);
  console.log(`   → ${OUT}`);
}

main();
