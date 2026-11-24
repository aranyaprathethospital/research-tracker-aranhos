import Loading from "./loading";
import { getSignedInProfile } from "@/lib/server-access";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { canManageProjects } from "@/lib/roles";
import type { Role } from "@/lib/research-types";
import ProfileEditor from "@/features/profile/components/profile-editor";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={<Loading />}
    >
      <ProfilePageContent />
    </Suspense>
  );
}

async function ProfilePageContent() {
  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  if (context.profile.mustChangePassword) redirect("/account/password");

  const { profile, activeMode } = context;
  const role: Role = activeMode === "ADVISOR"
    ? "Advisor"
    : activeMode === "ADVISEE"
      ? "Advisee"
      : profile.systemRole === "SUPERADMIN"
        ? "Superadmin"
        : "PM";
  const where = canManageProjects(profile.systemRole)
    ? {}
    : activeMode === "ADVISOR"
      ? { advisors: { some: { advisorId: profile.id } } }
      : { adviseeId: profile.id };
  const projectCount = await prisma.researchProject.count({ where });

  return (
    <ProfileEditor
      personName={profile.fullName}
      role={role}
      systemRole={profile.systemRole}
      availableRoles={profile.capabilities.map((grant) => grant.capability === "ADVISOR" ? "Advisor" : "Advisee")}
      projectCount={projectCount}
    />
  );
}
