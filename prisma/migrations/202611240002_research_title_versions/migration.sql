BEGIN;

ALTER TABLE "ResearchProject" ADD COLUMN "titleVersion" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "ResearchTitleVersion" (
  "projectId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "author" TEXT,
  "createdAt" TIMESTAMP(3),
  CONSTRAINT "ResearchTitleVersion_pkey" PRIMARY KEY ("projectId", "version"),
  CONSTRAINT "ResearchTitleVersion_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "ResearchTitleVersion" ("projectId", "version", "title")
SELECT "id", 1, "title" FROM "ResearchProject";

COMMIT;
