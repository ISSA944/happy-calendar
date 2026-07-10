/**
 * Импорт календарных праздников из «Праздники_поздравления_2026.xlsx» → seed-data/holidays.json.
 *
 * Запуск:  npx ts-node scripts/import-holidays.ts
 *
 * Исходный xlsx лежит в backend/data/ (gitignored, клиентский артефакт).
 * Результат — reviewable JSON в prisma/seed-data/holidays.json (коммитится).
 * Заливка в БД — через prisma/seed.ts (npx prisma db seed).
 *
 * Колонки листа (ТЗ п. 2): A=Дата(DD.MM.2026) C=Праздник D=Милая E=С юмором
 * F=Циничная G=Тема фона. Колонки H–K (визуальные ключи/палитра/промпт) не нужны.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { normalizeTheme } from '../src/holidays/themes.constant';

const DATA_DIR = path.resolve(__dirname, '../data');
const OUT = path.resolve(__dirname, '../prisma/seed-data/holidays.json');

/** Ищем xlsx по ключевому слову с учётом Unicode-нормализации (Telegram-имена бывают в NFD). */
function findXlsx(keyword: string): string | null {
  if (!fs.existsSync(DATA_DIR)) return null;
  const kw = keyword.normalize('NFC').toLowerCase();
  const match = fs
    .readdirSync(DATA_DIR)
    .find((f) => f.toLowerCase().endsWith('.xlsx') && f.normalize('NFC').toLowerCase().includes(kw));
  return match ? path.join(DATA_DIR, match) : null;
}

const SRC = findXlsx('праздники');

interface HolidaySeed {
  date: string; // DD.MM
  title: string;
  cute: string;
  humor: string;
  cynical: string;
  themeKey: string;
  scope: 'ru' | 'intl';
}

/**
 * Эвристика scope (размётки от клиента нет — ТЗ п. 2 «при необходимости добавить»).
 * intl, если заголовок начинается со «Всемирный/Международный» И не упоминает Россию
 * (иначе «Международный женский день в России» ошибочно попал бы в intl).
 * Используется только для сортировки/бейджа; праздники дня показываем ВСЕ (см. holidays API).
 */
function guessScope(title: string): 'ru' | 'intl' {
  const t = title.trim().toLowerCase();
  const intlPrefix = /^(всемирный|международный)/.test(t);
  const mentionsRussia = /росси/.test(t);
  return intlPrefix && !mentionsRussia ? 'intl' : 'ru';
}

function toDdMm(rawDate: string): string | null {
  // Ожидаем "DD.MM.YYYY" или "DD.MM". Берём первые два компонента.
  const m = /^(\d{2})\.(\d{2})/.exec(String(rawDate).trim());
  return m ? `${m[1]}.${m[2]}` : null;
}

function main() {
  if (!SRC || !fs.existsSync(SRC)) {
    console.error(`❌ Не найден xlsx праздников в backend/data/ (искал по «праздники»).`);
    process.exit(1);
  }

  const wb = XLSX.readFile(SRC);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, blankrows: false });

  const out: HolidaySeed[] = [];
  let skipped = 0;

  // rows[0] — заголовок
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const date = toDdMm(String(r[0] ?? ''));
    const title = String(r[2] ?? '').trim();
    if (!date || !title) {
      skipped++;
      continue;
    }
    out.push({
      date,
      title,
      cute: String(r[3] ?? '').trim(),
      humor: String(r[4] ?? '').trim(),
      cynical: String(r[5] ?? '').trim(),
      themeKey: normalizeTheme(String(r[6] ?? '')),
      scope: guessScope(title),
    });
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');

  const intl = out.filter((h) => h.scope === 'intl').length;
  console.log(`✅ Импортировано ${out.length} праздников (пропущено пустых: ${skipped}).`);
  console.log(`   scope: ru=${out.length - intl}, intl=${intl}`);
  console.log(`   → ${OUT}`);
}

main();
