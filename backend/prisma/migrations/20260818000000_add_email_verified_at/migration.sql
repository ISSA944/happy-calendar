ALTER TABLE "users"
ADD COLUMN "email_verified_at" TIMESTAMP(3);

-- До этой миграции профиль создавался только после успешного verify-otp.
-- Поэтому наличие profile — надёжный признак уже подтверждённого аккаунта.
UPDATE "users" AS "u"
SET "email_verified_at" = COALESCE("u"."welcome_email_sent_at", "u"."updated_at", "u"."created_at")
WHERE EXISTS (
  SELECT 1
  FROM "profile" AS "p"
  WHERE "p"."user_id" = "u"."id"
);
