ALTER TABLE "ResumeAnalysis" ADD COLUMN IF NOT EXISTS "scoringVersion" TEXT;
ALTER TABLE "ResumeAnalysis" ADD COLUMN IF NOT EXISTS "skillEvidence" JSONB NOT NULL DEFAULT '[]'::jsonb;
