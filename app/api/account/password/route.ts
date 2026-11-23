import { NextResponse } from "next/server";
import { verifyPassword } from "better-auth/crypto";
import { getProfileForRequest } from "@/lib/server-access";
import { prisma } from "@/lib/prisma";
import { saveCredentialPassword } from "@/lib/credentials";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

export async function POST(request: Request) {
  const context = await getProfileForRequest(request.headers, { allowPasswordChange: true });
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "Use a password between 6 and 128 characters." }, { status: 400 });
  }

  if (!context.profile.mustChangePassword) {
    const account = await prisma.account.findFirst({ where: { userId: context.session.user.id, providerId: "credential" }, select: { password: true } });
    if (!account?.password || !currentPassword || !(await verifyPassword({ hash: account.password, password: currentPassword }))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await saveCredentialPassword(context.session.user.id, newPassword, tx);
    await tx.researchProfile.update({ where: { id: context.profile.id }, data: { mustChangePassword: false } });
    await tx.session.deleteMany({ where: { userId: context.session.user.id, id: { not: context.session.session.id } } });
  });
  return NextResponse.json({ ok: true });
}
