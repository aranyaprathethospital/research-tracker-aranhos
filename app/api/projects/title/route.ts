import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectInclude, toResearchItem } from "@/lib/research-data";
import { canEditResearchTitle } from "@/lib/research-types";
import { getProfileForRequest } from "@/lib/server-access";

export async function PATCH(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const { id, expectedVersion, expectedTitle, action = "advance" } = body ?? {};
  if (typeof id !== "string" || !title || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1
    || (action !== "advance" && action !== "edit")
    || (expectedTitle !== undefined && typeof expectedTitle !== "string")
    || (action === "edit" && typeof expectedTitle !== "string")) {
    return NextResponse.json({ error: "กรุณากรอกชื่อเรื่องและตรวจสอบรอบปัจจุบัน" }, { status: 400 });
  }

  const { profile, activeMode } = context;
  const isPM = profile.systemRole === "PM";
  const scope = isPM ? { id } : { id, adviseeId: profile.id };
  if (!isPM && activeMode !== "ADVISEE") {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์แก้ไขชื่อเรื่อง" }, { status: 403 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.researchProject.findFirst({ where: scope, include: projectInclude() });
    if (!current) return { status: 404 } as const;
    if (current.titleVersion !== expectedVersion || (expectedTitle !== undefined && current.title !== expectedTitle)) {
      return { status: 409, project: current } as const;
    }
    if (!canEditResearchTitle({
      systemRole: profile.systemRole,
      isOwnerInAdviseeMode: activeMode === "ADVISEE" && current.adviseeId === profile.id,
      version: current.titleVersion,
    })) return { status: 403 } as const;
    if ((action === "edit" || current.titleVersion >= 3) && title === current.title) {
      return { status: 200, project: current } as const;
    }

    const nextVersion = action === "edit" ? expectedVersion : expectedVersion + 1;
    const updated = await tx.researchProject.updateMany({
      where: { ...scope, titleVersion: expectedVersion, title: current.title },
      data: { title, titleVersion: nextVersion },
    });
    if (!updated.count) {
      const latest = await tx.researchProject.findFirst({ where: scope, include: projectInclude() });
      return latest ? { status: 409, project: latest } as const : { status: 404 } as const;
    }

    const versionData = { projectId: id, version: nextVersion, title, author: profile.fullName, createdAt: new Date() };
    if (action === "edit") {
      await tx.researchTitleVersion.upsert({
        where: { projectId_version: { projectId: id, version: nextVersion } },
        create: versionData,
        update: { title },
      });
    } else {
      await tx.researchTitleVersion.create({ data: versionData });
    }
    const project = await tx.researchProject.findUniqueOrThrow({ where: { id }, include: projectInclude() });
    return { status: 200, project } as const;
  });

  if (result.status === 404) return NextResponse.json({ error: "ไม่พบโครงการ" }, { status: 404 });
  if (result.status === 403) return NextResponse.json({ error: "เฉพาะ PM ที่แก้ชื่อ Final ได้" }, { status: 403 });
  const project = toResearchItem(result.project, activeMode === "ADVISOR" ? profile.id : undefined);
  if (result.status === 409) {
    return NextResponse.json({ error: "ชื่อเรื่องถูกแก้ไขแล้ว กรุณาโหลดชื่อเรื่องล่าสุด", project }, { status: 409 });
  }
  return NextResponse.json({ project });
}
