import { Suspense } from "react";
import { redirect } from "next/navigation";
import { NotificationFeed } from "@/features/workspace/components/notifications";
import WorkspaceShell from "@/features/workspace/components/workspace-shell";
import WorkspaceLoading from "@/features/workspace/components/workspace-loading";
import { Placeholder } from "@/components/ui/page-loading";
import { getSignedInProfile } from "@/lib/server-access";
import { profileFileHref } from "@/lib/storage";
import { canManageProjects } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import PageHeading from "@/features/workspace/components/page-heading";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<WorkspaceLoading label="กำลังโหลดการแจ้งเตือน"><Placeholder className="h-48" /></WorkspaceLoading>}>
      <NotificationsContent />
    </Suspense>
  );
}

async function NotificationsContent() {
  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  const { profile, activeMode } = context;
  if (profile.mustChangePassword) redirect("/account/password");
  const where = canManageProjects(profile.systemRole) ? {}
    : activeMode === "ADVISOR" ? { advisors: { some: { advisorId: profile.id } } }
    : { adviseeId: profile.id };
  const projectCount = await prisma.researchProject.count({ where });

  return (
    <WorkspaceShell activeItem="การแจ้งเตือน" personName={profile.fullName}
      avatarUrl={profileFileHref(profile.id, "avatar", profile.avatarPath)}
      role={activeMode === "ADVISOR" ? "Advisor" : activeMode === "ADVISEE" ? "Advisee" : profile.systemRole === "SUPERADMIN" ? "Superadmin" : "PM"}
      systemRole={profile.systemRole} availableRoles={profile.capabilities.map(({ capability }) => capability === "ADVISOR" ? "Advisor" : "Advisee")}
      projectCount={projectCount}>
      <PageHeading title="การแจ้งเตือน" description="ติดตามการมอบหมายโครงการ สถานะการตรวจ และความเห็นใหม่" />
      <div className="overflow-hidden rounded-xl border border-[#e7e0d9]"><NotificationFeed /></div>
    </WorkspaceShell>
  );
}
