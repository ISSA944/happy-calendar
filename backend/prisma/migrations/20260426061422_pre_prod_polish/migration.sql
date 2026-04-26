/*
  Warnings:

  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE INDEX "horoscopes_date_idx" ON "horoscopes"("date");
