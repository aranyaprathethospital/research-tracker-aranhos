import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { SystemRole } from "@/generated/prisma/client";
import { saveCredentialPassword } from "@/lib/credentials";
import { getProfileForRequest } from "@/lib/server-access";
import { canManageUsers, canManageSystemRoles } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(context.profile.systemRole)) return NextResponse.json({ error: "Only PM or Superadmin can issue a temporary password." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== "string") return NextResponse.json({ error: "User not found." }, { status: 400 });
  const target = await prisma.researchProfile.findUnique({ where: { id: body.id }, select: { id: true, userId: true, email: true, systemRole: true, active: true } });
  if (!target || !target.userId) return NextResponse.json({ error: "The account has not linked through ProviderID yet." }, { status: 404 });
  if (!target.active || !target.email) return NextResponse.json({ error: "The user must be active and have a login email." }, { status: 409 });
  if (target.id === context.profile.id) return NextResponse.json({ error: "Use account settings to change your own password." }, { status: 400 });
  if (target.systemRole !== SystemRole.USER && !canManageSystemRoles(context.profile.systemRole)) {
    return NextResponse.json({ error: "Only Superadmin can reset a PM or Superadmin password." }, { status: 403 });
  }

  const temporaryPassword = randomBytes(18).toString("base64url");
  await prisma.$transaction(async (tx) => {
    await saveCredentialPassword(target.userId!, temporaryPassword, tx);
    await tx.researchProfile.update({ where: { id: target.id }, data: { mustChangePassword: true } });
    await tx.session.deleteMany({ where: { userId: target.userId! } });
  });
  return NextResponse.json({ temporaryPassword });
}
