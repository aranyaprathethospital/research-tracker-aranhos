import Dashboard from "@/features/research/components/dashboard";
import { prisma } from "@/lib/prisma";
import { isProviderIdConfigured } from "@/lib/provider-id";
import { projectInclude, toResearchItem } from "@/lib/research-data";
import { profileFileHref } from "@/lib/storage";
import { progressFromStage } from "@/lib/research-types";
import { canManageProjects } from "@/lib/roles";
import { researchProjectScope } from "@/lib/research-access";
import { getSignedInProfile } from "@/lib/server-access";
import { redirect } from "next/navigation";
import type { WorkspaceView } from "@/features/workspace/navigation";

export default async function ResearchWorkspace({ view, stage, projectId, focusReview }: {
  view: WorkspaceView; stage?: string; projectId?: string; focusReview?: boolean;
}) {
  if (!isProviderIdConfigured()) redirect("/login?setup=1");
  const authContext = await getSignedInProfile();
  if (!authContext) redirect("/login");
  const { profile, activeMode, session } = authContext;
  const credential = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { id: true },
  });
  if (!credential) redirect("/account/setup");
  if (profile.mustChangePassword) redirect("/account/password");

  const availableModes = profile.capabilities.map((grant) => grant.capability);
  if (availableModes.length > 1 && !activeMode) redirect("/choose-role");
  if (profile.systemRole === "USER" && !activeMode) redirect("/choose-role");

  const manager = canManageProjects(profile.systemRole);
  const where = researchProjectScope(profile, activeMode);
  const isTeamView = view === "ทีม";
  const [records, peerRecords, directory, navigationCounts] = await Promise.all([
    isTeamView ? [] : prisma.researchProject.findMany({
      where,
      include: projectInclude(),
      orderBy: { updatedAt: "desc" },
    }),
    view === "ภาพรวม" && activeMode === "ADVISEE" && !manager
      ? prisma.researchProject.findMany({
          where: { adviseeId: { not: profile.id } },
          select: { id: true, title: true, stage: true, advisee: { select: { fullName: true } } },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        })
      : null,
    profile.systemRole === "PM"
      ? prisma.researchProfile.findMany({
          where: { active: true },
          select: { id: true, fullName: true, capabilities: { select: { capability: true } } },
          orderBy: { fullName: "asc" },
        })
      : [],
    isTeamView ? Promise.all([
      prisma.researchProject.count({ where }),
      prisma.advisorComment.count({ where: { project: where } }),
    ]) : null,
  ]);
  const activeRole =
    activeMode === "ADVISOR"
      ? "Advisor"
      : activeMode === "ADVISEE"
        ? "Advisee"
        : profile.systemRole === "SUPERADMIN"
          ? "Superadmin"
          : "PM";
  const missingProject = !!projectId && !records.some((record) => record.id === projectId);
  const alternateMode = activeMode === "ADVISOR" ? "ADVISEE" : "ADVISOR";
  const canSwitch = missingProject && !manager && availableModes.includes(alternateMode)
    ? Boolean(await prisma.researchProject.findFirst({
        where: { id: projectId, ...(alternateMode === "ADVISEE"
          ? { adviseeId: profile.id }
          : { advisors: { some: { advisorId: profile.id } } }) },
        select: { id: true },
      }))
    : false;

  return (
    <Dashboard
      key={`${profile.id}:${activeMode ?? profile.systemRole}:${view}:${stage ?? ""}:${projectId ?? ""}:${focusReview ?? false}`}
      projectId={projectId}
      focusReview={focusReview}
      alternateMode={canSwitch ? alternateMode : undefined}
      initialItems={records.map((record) => toResearchItem(record, activeMode === "ADVISOR" ? profile.id : undefined))}
      avatarUrl={profileFileHref(profile.id, "avatar", profile.avatarPath)}
      navigationCounts={navigationCounts ?? undefined}
      view={view}
      peerProjects={peerRecords?.map(({ id, title, stage: projectStage, advisee }) => ({
        id, title, stage: projectStage, progress: progressFromStage(projectStage), researcher: advisee.fullName,
      }))}
      initialStage={stage}
      role={activeRole}
      availableRoles={availableModes.map((mode) =>
        mode === "ADVISOR" ? "Advisor" : "Advisee",
      )}
      systemRole={profile.systemRole}
      personName={profile.fullName}
      currentProfileId={profile.id}
      directory={directory.map((person) => ({
        id: person.id,
        name: person.fullName,
        capabilities: person.capabilities.map((grant) => grant.capability),
        active: true,
      }))}
    />
  );
}
