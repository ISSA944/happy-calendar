-- Редизайн personal_care_days под реальный клиентский контент (365 дней × 4 цели, xlsx «Личные праздники»).
-- Аддитивно: старые 9 legacy-строк (прототипный сид) НЕ удаляются — на них ссылаются существующие
-- personal_care_completions через FK RESTRICT. Они получают day_of_year = NULL (никогда не выбираются
-- в getToday(), который адресует день строго по номеру года) и backfill всех 4 пар task/advice из
-- старых task/affirmation, чтобы новые NOT NULL колонки были заполнены на всех строках.

-- AlterTable: новые колонки (пока nullable — заполняем ниже)
ALTER TABLE "personal_care_days" ADD COLUMN     "day_of_year" INTEGER;
ALTER TABLE "personal_care_days" ADD COLUMN     "calm_task" TEXT;
ALTER TABLE "personal_care_days" ADD COLUMN     "calm_advice" TEXT;
ALTER TABLE "personal_care_days" ADD COLUMN     "hear_task" TEXT;
ALTER TABLE "personal_care_days" ADD COLUMN     "hear_advice" TEXT;
ALTER TABLE "personal_care_days" ADD COLUMN     "food_task" TEXT;
ALTER TABLE "personal_care_days" ADD COLUMN     "food_advice" TEXT;
ALTER TABLE "personal_care_days" ADD COLUMN     "move_task" TEXT;
ALTER TABLE "personal_care_days" ADD COLUMN     "move_advice" TEXT;

-- Backfill legacy-строк (day_of_year ещё везде NULL на этом шаге, т.е. все существующие строки):
-- один и тот же старый task/affirmation копируется во все 4 варианта цели.
UPDATE "personal_care_days"
SET "calm_task" = "task", "calm_advice" = "affirmation",
    "hear_task" = "task", "hear_advice" = "affirmation",
    "food_task" = "task", "food_advice" = "affirmation",
    "move_task" = "task", "move_advice" = "affirmation"
WHERE "day_of_year" IS NULL;

-- AlterTable: goal_id на completions — какая именно цель была показана/засчитана в этот день.
ALTER TABLE "personal_care_completions" ADD COLUMN     "goal_id" TEXT;

-- Backfill существующих completions (историческая аппроксимация): первый тег старого дня, иначе 'calm'.
UPDATE "personal_care_completions" c
SET "goal_id" = COALESCE(
  (SELECT d."goal_tags"[1] FROM "personal_care_days" d WHERE d."id" = c."personal_care_day_id"),
  'calm'
)
WHERE c."goal_id" IS NULL;

ALTER TABLE "personal_care_completions" ALTER COLUMN "goal_id" SET NOT NULL;

-- Теперь все строки personal_care_days заполнены — можно требовать NOT NULL.
ALTER TABLE "personal_care_days" ALTER COLUMN "calm_task" SET NOT NULL;
ALTER TABLE "personal_care_days" ALTER COLUMN "calm_advice" SET NOT NULL;
ALTER TABLE "personal_care_days" ALTER COLUMN "hear_task" SET NOT NULL;
ALTER TABLE "personal_care_days" ALTER COLUMN "hear_advice" SET NOT NULL;
ALTER TABLE "personal_care_days" ALTER COLUMN "food_task" SET NOT NULL;
ALTER TABLE "personal_care_days" ALTER COLUMN "food_advice" SET NOT NULL;
ALTER TABLE "personal_care_days" ALTER COLUMN "move_task" SET NOT NULL;
ALTER TABLE "personal_care_days" ALTER COLUMN "move_advice" SET NOT NULL;

-- Старые общие поля больше не нужны — заменены 4 парами выше.
ALTER TABLE "personal_care_days" DROP COLUMN "task";
ALTER TABLE "personal_care_days" DROP COLUMN "affirmation";
ALTER TABLE "personal_care_days" DROP COLUMN "goal_tags";

-- Уникальность day_of_year (Postgres допускает сколько угодно NULL в UNIQUE — legacy-строки не конфликтуют).
CREATE UNIQUE INDEX "personal_care_days_day_of_year_key" ON "personal_care_days"("day_of_year");
