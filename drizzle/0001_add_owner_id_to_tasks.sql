ALTER TABLE "tasks" ADD COLUMN "owner_id" bigint;
UPDATE "tasks" SET "owner_id" = 0 WHERE "owner_id" IS NULL;
ALTER TABLE "tasks" ALTER COLUMN "owner_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "tasks_owner_id_idx" ON "tasks" ("owner_id");
CREATE INDEX IF NOT EXISTS "tasks_owner_id_status_idx" ON "tasks" ("owner_id", "status");
