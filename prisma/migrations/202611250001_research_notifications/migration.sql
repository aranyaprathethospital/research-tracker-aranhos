BEGIN;

CREATE TABLE "ResearchNotification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "recipientId" TEXT NOT NULL REFERENCES "ResearchProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "projectId" TEXT REFERENCES "ResearchProject"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "kind" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "projectTitle" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3)
);
CREATE INDEX "ResearchNotification_recipientId_createdAt_id_idx" ON "ResearchNotification" ("recipientId", "createdAt", "id");
CREATE INDEX "ResearchNotification_recipientId_readAt_idx" ON "ResearchNotification" ("recipientId", "readAt");
ALTER TABLE "ResearchNotification" ENABLE ROW LEVEL SECURITY;

COMMIT;
