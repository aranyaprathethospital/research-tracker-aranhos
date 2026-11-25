import { NextResponse } from "next/server";
import { getProfileForRequest } from "@/lib/server-access";
import { prisma } from "@/lib/prisma";
import { createProfileFileUrl } from "@/lib/storage";
import { canManageUsers } from "@/lib/roles";

type RouteContext = { params: Promise<{ profileId: string; kind: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, kind } = await params;
  if (kind !== "avatar" && kind !== "signature") return NextResponse.json({ error: "File not found." }, { status: 404 });
  const profile = await prisma.researchProfile.findUnique({
    where: { id: profileId },
    select: { active: true, avatarPath: true, signaturePath: true },
  });
  if (!profile || (!profile.active && !canManageUsers(context.profile.systemRole))) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const path = kind === "avatar" ? profile.avatarPath : profile.signaturePath;
  if (!path) return NextResponse.json({ error: "File not found." }, { status: 404 });

  try {
    const signedUrl = await createProfileFileUrl(path, 300);
    return NextResponse.redirect(signedUrl, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "Profile storage is unavailable." }, { status: 503 });
  }
}
