/**
 * Заливка справочного контента в БД (идемпотентно).
 *
 * Запуск:  npx prisma db seed   (или npx ts-node prisma/seed.ts)
 *
 * Источники (генерируются импорт-скриптами из backend/data/*.xlsx):
 *   - prisma/seed-data/holidays.json          ← scripts/import-holidays.ts
 *   - prisma/seed-data/push-milestones.json   ← scripts/import-push-milestones.ts
 *   - prisma/seed-data/personal-care-days.json ← scripts/import-personal-care.ts
 *
 * Порядок: сначала запусти оба import-*.ts, потом этот seed.
 */
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// process.cwd()-relative, не __dirname: этот скрипт компилируется в dist/prisma/seed.js
// (зеркалит src-структуру), но seed-data/*.json лежит только в исходном prisma/ —
// __dirname после компиляции указывал бы на dist/prisma, а не на настоящий prisma/.
// Запуск всегда ожидается из корня backend/ (и локально, и в контейнере — /app).
const DATA_DIR = path.resolve(process.cwd(), 'prisma', 'seed-data');

function readJson<T>(file: string): T | null {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) {
    console.warn(`⚠️  ${file} не найден — пропускаю. Сначала запусти соответствующий import-скрипт.`);
    return null;
  }
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

async function seedHolidays() {
  type H = { date: string; title: string; cute: string; humor: string; cynical: string; themeKey: string; scope: string };
  const data = readJson<H[]>('holidays.json');
  if (!data) return;
  await prisma.calendarHoliday.deleteMany({});
  // Пачками, чтобы не упереться в лимит параметров.
  const CHUNK = 500;
  for (let i = 0; i < data.length; i += CHUNK) {
    await prisma.calendarHoliday.createMany({ data: data.slice(i, i + CHUNK) });
  }
  console.log(`✅ calendar_holidays: ${data.length}`);
}

async function seedMilestones() {
  type M = { milestone: number; emoji: string; title: string; body: string };
  const data = readJson<M[]>('push-milestones.json');
  if (!data) return;
  for (const m of data) {
    await prisma.pushMilestoneTemplate.upsert({
      where: { milestone: m.milestone },
      update: { emoji: m.emoji, title: m.title, body: m.body },
      create: m,
    });
  }
  console.log(`✅ push_milestone_templates: ${data.length}`);
}

async function seedPersonalCareDays() {
  type P = {
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
  };
  const data = readJson<P[]>('personal-care-days.json');
  if (!data) return;
  // Upsert по dayOfYear — идемпотентно, и никогда не трогает legacy-строки старого прототипного
  // сида (у них dayOfYear = NULL, они на completions FK RESTRICT, поэтому не удаляются вовсе).
  for (const d of data) {
    await prisma.personalCareDay.upsert({ where: { dayOfYear: d.dayOfYear }, update: d, create: d });
  }
  console.log(`✅ personal_care_days (по dayOfYear): ${data.length}`);
}

async function main() {
  await seedHolidays();
  await seedMilestones();
  await seedPersonalCareDays();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
