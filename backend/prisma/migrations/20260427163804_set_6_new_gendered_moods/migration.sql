-- AlterTable
ALTER TABLE "profile" ALTER COLUMN "current_mood" SET DEFAULT 'Нормально';

-- Reset all existing profiles to the new neutral default ("clean slate" per client request).
-- The 8 old moods (Спокойное/Радостное/Грустное/Тревожное/Энергичное/Спокойна/Счастлива/Тревога/Грусть/Злость/Нейтрально/Воодушевлена)
-- are replaced with the canonical 6 (Спокойна/Нормально/Устала/Тревожна/Грустна/Воодушевлена).
UPDATE "profile" SET "current_mood" = 'Нормально';
