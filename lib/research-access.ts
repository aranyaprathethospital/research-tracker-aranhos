import "server-only";
import { canManageProjects } from "@/lib/roles";
import type { Prisma, ProfileCapability, SystemRole } from "@/generated/prisma/client";

export function researchProjectScope(profile: { id: string; systemRole: SystemRole }, mode: ProfileCapability | null): Prisma.ResearchProjectWhereInput {
  if (canManageProjects(profile.systemRole)) return {};
  if (mode === "ADVISOR") return { advisors: { some: { advisorId: profile.id } } };
  if (mode === "ADVISEE") return { adviseeId: profile.id };
  return { id: { in: [] } };
}
