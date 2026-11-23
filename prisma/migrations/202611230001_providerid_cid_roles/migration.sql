ALTER TYPE "ResearchRole" ADD VALUE 'SUPERADMIN';

ALTER TABLE "ResearchProfile"
  ALTER COLUMN "providerId" DROP NOT NULL,
  ADD COLUMN "cidLookupKey" TEXT;

CREATE UNIQUE INDEX "ResearchProfile_cidLookupKey_key"
  ON "ResearchProfile"("cidLookupKey");

ALTER TABLE "ResearchProfile"
  ADD CONSTRAINT "ResearchProfile_cidLookupKey_format"
  CHECK ("cidLookupKey" IS NULL OR "cidLookupKey" ~ '^[a-f0-9]{64}$');
