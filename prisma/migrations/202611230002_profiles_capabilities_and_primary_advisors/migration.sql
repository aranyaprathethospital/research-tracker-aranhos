CREATE TYPE "SystemRole" AS ENUM ('USER', 'PM', 'SUPERADMIN');
CREATE TYPE "ProfileCapability" AS ENUM ('ADVISOR', 'ADVISEE');
CREATE TYPE "AdvisorAssignmentType" AS ENUM ('PRIMARY', 'SECONDARY');

ALTER TABLE "ResearchProfile"
  RENAME COLUMN "displayName" TO "fullName";

ALTER TABLE "ResearchProfile"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "systemRole" "SystemRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "position" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "positionLevel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "mission" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "workGroup" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "avatarPath" TEXT,
  ADD COLUMN "signaturePath" TEXT;

UPDATE "ResearchProfile" SET "systemRole" = 'PM' WHERE "role" = 'PM';
UPDATE "ResearchProfile" SET "systemRole" = 'SUPERADMIN' WHERE "role" = 'SUPERADMIN';

CREATE TABLE "ProfileCapabilityGrant" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "capability" "ProfileCapability" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileCapabilityGrant_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProfileCapabilityGrant" ("id", "profileId", "capability")
SELECT gen_random_uuid()::text, "id", 'ADVISOR' FROM "ResearchProfile" WHERE "role" = 'ADVISOR';

INSERT INTO "ProfileCapabilityGrant" ("id", "profileId", "capability")
SELECT gen_random_uuid()::text, "id", 'ADVISEE' FROM "ResearchProfile" WHERE "role" = 'ADVISEE';

CREATE UNIQUE INDEX "ResearchProfile_email_key" ON "ResearchProfile"("email");
CREATE UNIQUE INDEX "ProfileCapabilityGrant_profileId_capability_key"
  ON "ProfileCapabilityGrant"("profileId", "capability");
CREATE INDEX "ProfileCapabilityGrant_capability_profileId_idx"
  ON "ProfileCapabilityGrant"("capability", "profileId");

ALTER TABLE "ProfileCapabilityGrant"
  ADD CONSTRAINT "ProfileCapabilityGrant_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "ResearchProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD COLUMN "activeMode" "ProfileCapability";

ALTER TABLE "ResearchProjectAdvisor"
  ADD COLUMN "assignmentType" "AdvisorAssignmentType" NOT NULL DEFAULT 'SECONDARY';

WITH ranked_advisors AS (
  SELECT "id", row_number() OVER (PARTITION BY "projectId" ORDER BY "assignedAt", "advisorId") AS ordinal
  FROM "ResearchProjectAdvisor"
)
UPDATE "ResearchProjectAdvisor" AS assignment
SET "assignmentType" = CASE WHEN ranked_advisors.ordinal = 1 THEN 'PRIMARY'::"AdvisorAssignmentType" ELSE 'SECONDARY'::"AdvisorAssignmentType" END
FROM ranked_advisors
WHERE assignment."id" = ranked_advisors."id";

CREATE UNIQUE INDEX "ResearchProjectAdvisor_one_primary_per_project_key"
  ON "ResearchProjectAdvisor"("projectId") WHERE "assignmentType" = 'PRIMARY';

ALTER TABLE "AdvisorReview"
  ADD CONSTRAINT "AdvisorReview_advisorId_fkey"
  FOREIGN KEY ("advisorId") REFERENCES "ResearchProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResearchProfile" DROP COLUMN "role";
DROP TYPE "ResearchRole";

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('research-profile-files', 'research-profile-files', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
