-- AlterTable
ALTER TABLE "prefs" ADD COLUMN     "holidays_time" TEXT NOT NULL DEFAULT '10:00',
ADD COLUMN     "horoscope_time" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN     "personal_care_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "personal_care_time" TEXT NOT NULL DEFAULT '08:30',
ADD COLUMN     "support_time" TEXT NOT NULL DEFAULT '12:00';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "welcome_email_sent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_care_days" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "affirmation" TEXT NOT NULL,
    "goal_tags" TEXT[],
    "theme_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_care_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_care_completions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "personal_care_day_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_care_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_holidays" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cute" TEXT NOT NULL,
    "humor" TEXT NOT NULL,
    "cynical" TEXT NOT NULL,
    "theme_key" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'ru',

    CONSTRAINT "calendar_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_images" (
    "id" TEXT NOT NULL,
    "calendar_holiday_id" TEXT,
    "personal_care_day_id" TEXT,
    "theme_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "holiday_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_milestone_templates" (
    "milestone" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "push_milestone_templates_pkey" PRIMARY KEY ("milestone")
);

-- CreateIndex
CREATE INDEX "user_goals_user_id_idx" ON "user_goals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_goals_user_id_goal_id_key" ON "user_goals"("user_id", "goal_id");

-- CreateIndex
CREATE INDEX "personal_care_completions_user_id_idx" ON "personal_care_completions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "personal_care_completions_user_id_date_key" ON "personal_care_completions"("user_id", "date");

-- CreateIndex
CREATE INDEX "calendar_holidays_date_idx" ON "calendar_holidays"("date");

-- CreateIndex
CREATE INDEX "holiday_images_theme_key_idx" ON "holiday_images"("theme_key");

-- AddForeignKey
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_care_completions" ADD CONSTRAINT "personal_care_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_care_completions" ADD CONSTRAINT "personal_care_completions_personal_care_day_id_fkey" FOREIGN KEY ("personal_care_day_id") REFERENCES "personal_care_days"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data migration: preserve each user's existing push time as the horoscope category time
-- (legacy single push_time → new per-category horoscope_time). Other category times keep defaults.
UPDATE "prefs" SET "horoscope_time" = "push_time";
