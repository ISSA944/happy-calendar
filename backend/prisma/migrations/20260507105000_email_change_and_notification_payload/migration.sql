ALTER TABLE "users"
  ADD COLUMN "pending_email" TEXT,
  ADD COLUMN "email_change_otp_hash" TEXT,
  ADD COLUMN "email_change_otp_expires_at" TIMESTAMP(3);

ALTER TABLE "notifications"
  ADD COLUMN "title" TEXT,
  ADD COLUMN "body" TEXT,
  ADD COLUMN "date" TEXT,
  ADD COLUMN "mood" TEXT;
