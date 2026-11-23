-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ResearchRole" AS ENUM ('PM', 'ADVISOR', 'ADVISEE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProfile" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "emailAlias" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "ResearchRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "faculty" TEXT,
    "stage" INTEGER NOT NULL DEFAULT 0,
    "stageProgress" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "issue" TEXT NOT NULL DEFAULT '',
    "nextTask" TEXT NOT NULL DEFAULT '',
    "adviseeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProjectAdvisor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchProjectAdvisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorReview" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ยังไม่ส่งตรวจ',
    "note" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorComment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvisorComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchUpdate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProfile_providerId_key" ON "ResearchProfile"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProfile_emailAlias_key" ON "ResearchProfile"("emailAlias");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProfile_userId_key" ON "ResearchProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProject_projectCode_key" ON "ResearchProject"("projectCode");

-- CreateIndex
CREATE INDEX "ResearchProject_adviseeId_idx" ON "ResearchProject"("adviseeId");

-- CreateIndex
CREATE INDEX "ResearchProject_stage_idx" ON "ResearchProject"("stage");

-- CreateIndex
CREATE INDEX "ResearchProject_dueDate_idx" ON "ResearchProject"("dueDate");

-- CreateIndex
CREATE INDEX "ResearchProject_updatedAt_idx" ON "ResearchProject"("updatedAt");

-- CreateIndex
CREATE INDEX "ResearchProjectAdvisor_advisorId_idx" ON "ResearchProjectAdvisor"("advisorId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProjectAdvisor_projectId_advisorId_key" ON "ResearchProjectAdvisor"("projectId", "advisorId");

-- CreateIndex
CREATE INDEX "AdvisorReview_advisorId_idx" ON "AdvisorReview"("advisorId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorReview_projectId_advisorId_key" ON "AdvisorReview"("projectId", "advisorId");

-- CreateIndex
CREATE INDEX "AdvisorComment_projectId_createdAt_idx" ON "AdvisorComment"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "AdvisorComment_authorId_idx" ON "AdvisorComment"("authorId");

-- CreateIndex
CREATE INDEX "ResearchUpdate_projectId_createdAt_idx" ON "ResearchUpdate"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProfile" ADD CONSTRAINT "ResearchProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_adviseeId_fkey" FOREIGN KEY ("adviseeId") REFERENCES "ResearchProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProjectAdvisor" ADD CONSTRAINT "ResearchProjectAdvisor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProjectAdvisor" ADD CONSTRAINT "ResearchProjectAdvisor_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "ResearchProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorReview" ADD CONSTRAINT "AdvisorReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorComment" ADD CONSTRAINT "AdvisorComment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorComment" ADD CONSTRAINT "AdvisorComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "ResearchProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchUpdate" ADD CONSTRAINT "ResearchUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchUpdate" ADD CONSTRAINT "ResearchUpdate_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "ResearchProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business-domain validation (kept in SQL because Prisma schema has no CHECK syntax).
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_stage_range" CHECK ("stage" BETWEEN 0 AND 7);
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_stage_progress_range" CHECK ("stageProgress" BETWEEN 0 AND 100);
ALTER TABLE "AdvisorReview" ADD CONSTRAINT "AdvisorReview_status_allowed" CHECK ("status" IN ('ยังไม่ส่งตรวจ', 'ส่งตรวจ', 'ขอแก้ไข', 'อนุมัติ'));

-- Better Auth session cookies are not Supabase Auth JWTs. The app accesses these
-- tables only through server-side Prisma after checking the Better Auth session
-- and ResearchProfile.role. Enable RLS and revoke Data API roles so a browser
-- cannot bypass those server checks. The application's database owner can access
-- the tables through Prisma's server-only connection.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResearchProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResearchProject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResearchProjectAdvisor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdvisorReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdvisorComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResearchUpdate" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "User", "Session", "Account", "Verification", "ResearchProfile",
  "ResearchProject", "ResearchProjectAdvisor", "AdvisorReview", "AdvisorComment", "ResearchUpdate"
  FROM anon, authenticated;
