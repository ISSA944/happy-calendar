/**
 * Импорт мотивационных пушей по вехам из «Пуши_мотивация_целей.xlsx»
 * → seed-data/push-milestones.json.
 *
 * Запуск:  npx ts-node scripts/import-push-milestones.ts
 *
 * Лист «Пуши по вехам» (ТЗ п. 3): A=Веха(дней) B=Эмодзи C=Заголовок D=Текст({имя}).
 */
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const DATA_DIR = path.resolve(__dirname, '../data');
const OUT = path.resolve(__dirname, '../prisma/seed-data/push-milestones.json');
const SHEET = 'Пуши по вехам';

/** Ищем xlsx по ключевому слову с учётом Unicode-нормализации (Telegram-имена бывают в NFD). */
function findXlsx(keyword: string): string | null {
  if (!fs.existsSync(DATA_DIR)) return null;
  const kw = keyword.normalize('NFC').toLowerCase();
  const match = fs
    .readdirSync(DATA_DIR)
    .find((f) => f.toLowerCase().endsWith('.xlsx') && f.normalize('NFC').toLowerCase().includes(kw));
  return match ? path.join(DATA_DIR, match) : null;
}

const SRC = findXlsx('мотивация');

interface MilestoneSeed {
  milestone: number;
  emoji: string;
  title: string;
  body: string;
}

function main() {
  if (!SRC || !fs.existsSync(SRC)) {
    console.error(`❌ Не найден xlsx с пушами в backend/data/ (искал по «мотивация»).`);
    process.exit(1);
  }

  const wb = XLSX.readFile(SRC);
  const ws = wb.Sheets[SHEET] ?? wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, blankrows: false });

  const out: MilestoneSeed[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const milestone = Number(r[0]);
    if (!Number.isFinite(milestone) || milestone <= 0) continue;
    out.push({
      milestone,
      emoji: String(r[1] ?? '').trim(),
      title: String(r[2] ?? '').trim(),
      body: String(r[3] ?? '').trim(),
    });
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log(`✅ Импортировано ${out.length} вех-пушей → ${OUT}`);
}

main();
