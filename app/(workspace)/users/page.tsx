import Loading from "./loading";
import StatusPanel, { StatusLink } from "@/components/status/status-panel";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { isProviderIdConfigured } from "@/lib/provider-id";
import { canManageUsers } from "@/lib/roles";
import { getSignedInProfile } from "@/lib/server-access";
import { profileFileHref } from "@/lib/storage";
import UserManagementPage from "@/features/users/components/user-management-page";
import type { UserDirectoryPerson } from "@/features/users/types";
import type { Role } from "@/lib/research-types";

export default function UsersPage() {
  return (
    <Suspense
      fallback={<Loading />}
    >
      <UsersPageContent />
    </Suspense>
  );
}

async function UsersPageContent() {
  if (!isProviderIdConfigured()) redirect("/login?setup=1");

  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  const { profile, activeMode, session } = context;

  const credential = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { id: true },
  });
  if (!credential) redirect("/account/setup");
  if (profile.mustChangePassword) redirect("/account/password");
  if (!canManageUsers(profile.systemRole)) {
    return <StatusPanel kind="forbidden" title="ไม่มีสิทธิ์จัดการผู้ใช้"
      description="บัญชีที่มีบทบาท PM หรือ Superadmin เท่านั้นที่เปิดหน้าจัดการผู้ใช้ได้">
      <StatusLink href="/">กลับ Workspace</StatusLink>
    </StatusPanel>;
  }

  const availableModes = profile.capabilities.map((grant) => grant.capability);
  if (availableModes.length > 1 && !activeMode) redirect("/choose-role");

  const [records, projectCount] = await Promise.all([
    prisma.researchProfile.findMany({
      include: { capabilities: { select: { capability: true } } },
      orderBy: { fullName: "asc" },
    }),
    prisma.researchProject.count(),
  ]);

  const people: UserDirectoryPerson[] = records.map((person) => ({
      id: person.id,
      name: person.fullName,
      fullName: person.fullName,
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
      avatarUrl: profileFileHref(person.id, "avatar", person.avatarPath),
      signatureUrl: profileFileHref(person.id, "signature", person.signaturePath),
  }));

  const role: Role = activeMode === "ADVISOR"
    ? "Advisor"
    : activeMode === "ADVISEE"
      ? "Advisee"
      : profile.systemRole === "SUPERADMIN"
        ? "Superadmin"
        : "PM";

  return (
    <UserManagementPage
      initialPeople={people}
      personName={profile.fullName}
      avatarUrl={profileFileHref(profile.id, "avatar", profile.avatarPath)}
      currentProfileId={profile.id}
      systemRole={profile.systemRole}
      role={role}
      availableRoles={availableModes.map((mode) => mode === "ADVISOR" ? "Advisor" : "Advisee")}
      projectCount={projectCount}
    />
  );
}
