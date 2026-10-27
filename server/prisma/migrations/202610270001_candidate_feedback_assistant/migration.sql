BEGIN;

-- Keep official rejection notes private unless the recruiter explicitly opts in.
ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "shareRejectionReason" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "shareableFeedbackUpdatedAt" TIMESTAMP(3);

-- Add evidence to future assessment attempts without changing existing results.
ALTER TABLE "TestAttempt"
  ADD COLUMN IF NOT EXISTS "categoryScores" JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "questionResults" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "strengths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "improvementAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "improvementSuggestions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

COMMIT;
