-- AlterTable
ALTER TABLE "users"
ADD COLUMN "otp_failed_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "otp_last_failed_at" TIMESTAMP(3);
