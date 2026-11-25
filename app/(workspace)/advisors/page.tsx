import { Suspense } from "react";
import StatusPanel, { StatusLink } from "@/components/status/status-panel";
import { redirect } from "next/navigation";
import AdvisorSummary, { type AdvisorWorkload } from "@/features/research/components/advisor-summary";
import WorkspaceShell from "@/features/workspace/components/workspace-shell";
import { profileFileHref } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { getSignedInProfile } from "@/lib/server-access";
import { progressFromStage } from "@/lib/research-types";
import Loading from "./loading";

export default function AdvisorsPage() {
  return <Suspense fallback={<Loading />}><AdvisorSummaryContent /></Suspense>;
}

async function AdvisorSummaryContent() {
  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  const { profile, session, activeMode } = context;
  if (profile.mustChangePassword) redirect("/account/password");
  if (profile.systemRole !== "PM") {
    return <StatusPanel kind="forbidden" title="ไม่มีสิทธิ์เปิดหน้าสรุปที่ปรึกษาหลัก"
      description="บัญชีที่มีบทบาท PM เท่านั้นที่ดูสรุปภาระงานของที่ปรึกษาหลักได้">
      <StatusLink href="/">กลับ Workspace</StatusLink>
    </StatusPanel>;
  }
  const credential = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { id: true },
  });
  if (!credential) redirect("/account/setup");
  if (profile.capabilities.length > 1 && !activeMode) redirect("/choose-role");

  const [assignments, projectCount] = await Promise.all([
    prisma.researchProjectAdvisor.findMany({
      where: { assignmentType: "PRIMARY" },
      select: {
        advisor: { select: { id: true, fullName: true } },
        project: { select: {
          id: true, title: true, stage: true, dueDate: true,
          advisee: { select: { fullName: true } },
        } },
      },
      orderBy: { project: { updatedAt: "desc" } },
    }),
    prisma.researchProject.count(),
  ]);
  const byAdvisor = new Map<string, AdvisorWorkload>();
  for (const { advisor, project } of assignments) {
    const entry = byAdvisor.get(advisor.id) ?? { id: advisor.id, name: advisor.fullName, projects: [] };
    entry.projects.push({
      id: project.id,
      title: project.title,
      advisee: project.advisee.fullName,
      stage: project.stage,
      progress: progressFromStage(project.stage),
      dueDate: project.dueDate?.toISOString().slice(0, 10) ?? null,
    });
    byAdvisor.set(advisor.id, entry);
  }
  const advisors = Array.from(byAdvisor.values()).sort((a, b) => b.projects.length - a.projects.length || a.name.localeCompare(b.name, "th"));

  return (
    <WorkspaceShell
      activeItem="สรุปที่ปรึกษาหลัก"
      personName={profile.fullName}
      avatarUrl={profileFileHref(profile.id, "avatar", profile.avatarPath)}
      role={activeMode === "ADVISOR" ? "Advisor" : activeMode === "ADVISEE" ? "Advisee" : "PM"}
      systemRole={profile.systemRole}
      availableRoles={profile.capabilities.map(({ capability }) => capability === "ADVISOR" ? "Advisor" : "Advisee")}
      projectCount={projectCount}
    >
      <AdvisorSummary advisors={advisors} />
    </WorkspaceShell>
  );
}
