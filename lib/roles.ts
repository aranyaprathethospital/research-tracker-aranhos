import type { ProfileCapability, SystemRole } from "@/generated/prisma/client";

export type WorkMode = ProfileCapability;

export function canManageProjects(role: SystemRole) {
  return role === "SUPERADMIN" || role === "PM";
}

export function canManageUsers(role: SystemRole) {
  return role === "SUPERADMIN" || role === "PM";
}

export function canManageSystemRoles(role: SystemRole) {
  return role === "SUPERADMIN";
}

export function hasCapability(grants: { capability: ProfileCapability }[], capability: ProfileCapability) {
  return grants.some((grant) => grant.capability === capability);
}

export function workModes(grants: { capability: ProfileCapability }[]) {
  return grants.map((grant) => grant.capability);
}
