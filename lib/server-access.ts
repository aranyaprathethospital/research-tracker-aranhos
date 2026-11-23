import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProfileCapability, ResearchProfile } from "@/generated/prisma/client";

const profileInclude = { capabilities: { select: { capability: true } } } as const;

async function loadContext(requestHeaders: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;

  const [profile, storedSession] = await Promise.all([
    prisma.researchProfile.findUnique({ where: { userId: session.user.id }, include: profileInclude }),
    prisma.session.findUnique({ where: { id: session.session.id }, select: { activeMode: true } }),
  ]);

  if (!profile || !profile.active) return null;
  const grants = profile.capabilities;
  const activeMode = storedSession?.activeMode && grants.some((grant) => grant.capability === storedSession.activeMode)
    ? storedSession.activeMode
    : grants.length === 1
      ? grants[0].capability
      : null;

  return { session, profile, activeMode };
}

export async function getSignedInProfile() {
  return loadContext(await headers());
}

export async function getProfileForRequest(requestHeaders: Headers, options: { allowPasswordChange?: boolean } = {}) {
  const context = await loadContext(requestHeaders);
  if (context?.profile.mustChangePassword && !options.allowPasswordChange) return null;
  return context;
}

export type ActiveProfile = ResearchProfile & {
  capabilities: { capability: ProfileCapability }[];
};
