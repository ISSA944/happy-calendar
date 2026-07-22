-- Раньше день заботы ротировал ОДНУ цель на день среди активных целей юзера, поэтому один зачёт
-- в сутки был уникален по (user_id, date). Теперь при >1 активной цели показываются ВСЕ сразу
-- (см. PersonalCareService.getToday()) и каждая цель засчитывается независимо, поэтому уникальность
-- расширяется до (user_id, date, goal_id) — иначе "Я сделала это" по второй цели того же дня
-- падало бы с конфликтом уникальности вместо создания отдельной записи.

DROP INDEX "personal_care_completions_user_id_date_key";

CREATE UNIQUE INDEX "personal_care_completions_user_id_date_goal_id_key" ON "personal_care_completions"("user_id", "date", "goal_id");
