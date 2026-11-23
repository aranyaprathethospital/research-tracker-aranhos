import { NextResponse } from "next/server";
import { ProfileCapability } from "@/generated/prisma/client";
import { getProfileForRequest } from "@/lib/server-access";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.mode !== ProfileCapability.ADVISOR && body?.mode !== ProfileCapability.ADVISEE) {
    return NextResponse.json({ error: "Choose a valid work mode." }, { status: 400 });
  }
  if (!context.profile.capabilities.some((grant) => grant.capability === body.mode)) {
    return NextResponse.json({ error: "This work mode has not been granted to your account." }, { status: 403 });
  }

  await prisma.session.updateMany({
    where: { id: context.session.session.id, userId: context.session.user.id },
    data: { activeMode: body.mode },
  });
  return NextResponse.json({ ok: true, mode: body.mode });
}
