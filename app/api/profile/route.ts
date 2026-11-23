import { NextResponse } from "next/server";
import { getProfileForRequest } from "@/lib/server-access";
import { prisma } from "@/lib/prisma";
import { createProfileFileUrl, profileStorageConfigured } from "@/lib/storage";

export async function GET(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, avatarUrl, signatureUrl] = await Promise.all([
    prisma.user.findUnique({ where: { id: context.session.user.id }, select: { email: true } }),
    context.profile.avatarPath && profileStorageConfigured() ? createProfileFileUrl(context.profile.avatarPath).catch(() => null) : null,
    context.profile.signaturePath && profileStorageConfigured() ? createProfileFileUrl(context.profile.signaturePath).catch(() => null) : null,
  ]);

  return NextResponse.json({
    profile: {
      id: context.profile.id,
      fullName: context.profile.fullName,
      email: context.profile.email ?? (user?.email.endsWith(".identity.invalid") ? "" : user?.email ?? ""),
      systemRole: context.profile.systemRole,
      capabilities: context.profile.capabilities.map((grant) => grant.capability),
      position: context.profile.position,
      positionLevel: context.profile.positionLevel,
      mission: context.profile.mission,
      workGroup: context.profile.workGroup,
      avatarUrl,
      signatureUrl,
      mustChangePassword: context.profile.mustChangePassword,
    },
  });
}

export async function PATCH(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.fullName !== "string" || !body.fullName.trim() || body.fullName.trim().length > 160) {
    return NextResponse.json({ error: "Enter a valid full name." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.researchProfile.update({ where: { id: context.profile.id }, data: { fullName: body.fullName.trim() } }),
    prisma.user.update({ where: { id: context.session.user.id }, data: { name: body.fullName.trim() } }),
  ]);
  return NextResponse.json({ ok: true });
}
