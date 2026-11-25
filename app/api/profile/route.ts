import { NextResponse } from "next/server";
import { z } from "zod";
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
      hasAvatar: Boolean(context.profile.avatarPath),
      signatureUrl,
      mustChangePassword: context.profile.mustChangePassword,
    },
  });
}

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  position: z.string().trim().max(160).optional(),
  positionLevel: z.string().trim().max(160).optional(),
  mission: z.string().trim().max(160).optional(),
  workGroup: z.string().trim().max(160).optional(),
});

export async function PATCH(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = profileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) {
    return NextResponse.json({ error: "กรุณากรอกชื่อเต็ม และให้แต่ละช่องยาวไม่เกิน 160 ตัวอักษร" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.researchProfile.update({ where: { id: context.profile.id }, data: result.data }),
    prisma.user.update({ where: { id: context.session.user.id }, data: { name: result.data.fullName } }),
  ]);
  return NextResponse.json({ ok: true });
}
