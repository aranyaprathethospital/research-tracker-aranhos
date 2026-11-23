import { NextResponse } from "next/server";
import { getProfileForRequest } from "@/lib/server-access";
import { prisma } from "@/lib/prisma";
import { saveCredentialPassword } from "@/lib/credentials";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : context.profile.fullName;
  if (!validEmail(email) || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH || !fullName || fullName.length > 160) {
    return NextResponse.json({ error: "Use a valid email, a password between 6 and 128 characters, and a full name." }, { status: 400 });
  }
  if (context.profile.email && context.profile.email !== email) return NextResponse.json({ error: "Ask PM to update the login email before setup." }, { status: 403 });

  const providerAccount = await prisma.account.findFirst({ where: { userId: context.session.user.id, providerId: "provider-id" }, select: { id: true } });
  if (!providerAccount) return NextResponse.json({ error: "Complete ProviderID sign-in before setting a local password." }, { status: 403 });
  const [emailUsedByUser, emailUsedByProfile, credential] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.researchProfile.findUnique({ where: { email }, select: { id: true } }),
    prisma.account.findFirst({ where: { userId: context.session.user.id, providerId: "credential" }, select: { id: true } }),
  ]);
  if ((emailUsedByUser && emailUsedByUser.id !== context.session.user.id) || (emailUsedByProfile && emailUsedByProfile.id !== context.profile.id)) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }
  if (credential) return NextResponse.json({ error: "A local password is already configured." }, { status: 409 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: context.session.user.id }, data: { email, emailVerified: false, name: fullName } });
      await tx.researchProfile.update({ where: { id: context.profile.id }, data: { email, fullName, mustChangePassword: false } });
      await saveCredentialPassword(context.session.user.id, password, tx);
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
    throw error;
  }
  return NextResponse.json({ ok: true });
}
