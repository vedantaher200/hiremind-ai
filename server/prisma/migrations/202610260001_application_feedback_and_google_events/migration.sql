BEGIN;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "shareableFeedback" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "feedbackCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMP(3);
ALTER TABLE "ScheduledInterview" ADD COLUMN IF NOT EXISTS "googleEventId" TEXT;
ALTER TABLE "ScheduledInterview" ADD COLUMN IF NOT EXISTS "timeZone" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ScheduledInterview_googleEventId_key" ON "ScheduledInterview"("googleEventId");
COMMIT;
