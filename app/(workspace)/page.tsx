import { prisma } from "@/lib/prisma";
import { isProviderIdConfigured } from "@/lib/provider-id";
import { projectInclude, toResearchItem } from "@/lib/research-data";
import { canManageProjects, canManageUsers } from "@/lib/roles";
import { getSignedInProfile } from "@/lib/server-access";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Dashboard from "./dashboard";

export default function Home() {
  return (
    <Suspense fallback={<main className="loading-screen">กำลังตรวจสอบบัญชีและโหลดงานวิจัย…</main>}>
      <ResearchDashboard />
    </Suspense>
  );
}

async function ResearchDashboard() {
  if (!isProviderIdConfigured()) redirect("/login?setup=1");
  const authContext = await getSignedInProfile();
  if (!authContext) redirect("/login");
  const { profile, activeMode, session } = authContext;
  const credential = await prisma.account.findFirst({ where: { userId: session.user.id, providerId: "credential" }, select: { id: true } });
  if (!credential) redirect("/account/setup");
  if (profile.mustChangePassword) redirect("/account/password");

  const availableModes = profile.capabilities.map((grant) => grant.capability);
  if (availableModes.length > 1 && !activeMode) redirect("/choose-role");
  if (profile.systemRole === "USER" && !activeMode) redirect("/choose-role");

  const manager = canManageProjects(profile.systemRole);
  const where = manager
    ? {}
    : activeMode === "ADVISOR"
      ? { advisors: { some: { advisorId: profile.id } } }
      : { adviseeId: profile.id };
  const records = await prisma.researchProject.findMany({
    where,
    include: projectInclude(),
    orderBy: { updatedAt: "desc" },
  });
  const directory = canManageUsers(profile.systemRole)
    ? await prisma.researchProfile.findMany({
        include: { capabilities: { select: { capability: true } } },
        orderBy: { fullName: "asc" },
      })
    : [];
  const activeRole = activeMode === "ADVISOR"
    ? "Advisor"
    : activeMode === "ADVISEE"
      ? "Advisee"
      : profile.systemRole === "SUPERADMIN"
        ? "Superadmin"
        : "PM";

  return (
    <Dashboard
      key={`${profile.id}:${activeMode ?? profile.systemRole}`}
      initialItems={records.map((record) => toResearchItem(record, activeMode === "ADVISOR" ? profile.id : undefined))}
      role={activeRole}
      availableRoles={availableModes.map((mode) => mode === "ADVISOR" ? "Advisor" : "Advisee")}
      systemRole={profile.systemRole}
      personName={profile.fullName}
      demo={false}
      directory={directory.map((person) => ({
        id: person.id,
        name: person.fullName,
        systemRole: person.systemRole,
        capabilities: person.capabilities.map((grant) => grant.capability),
        email: person.email ?? "",
        position: person.position,
        positionLevel: person.positionLevel,
        mission: person.mission,
        workGroup: person.workGroup,
        providerId: person.providerId,
        cidRegistered: Boolean(person.cidLookupKey),
        userId: person.userId,
        active: person.active,
      }))}
    />
  );
}
