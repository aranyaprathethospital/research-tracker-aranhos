import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfileForRequest } from "@/lib/server-access";

const pageSize = 20;
const readAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read"), id: z.string().min(1) }),
  z.object({ action: z.literal("read-all") }),
]);

export async function GET(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const where = { recipientId: context.profile.id };
  const unreadWhere = { ...where, readAt: null };
  if (params.get("count") === "1") {
    return NextResponse.json({ unread: await prisma.researchNotification.count({ where: unreadWhere }) });
  }
  const page = Number(params.get("page") ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) {
    return NextResponse.json({ error: "หมายเลขหน้าไม่ถูกต้อง" }, { status: 400 });
  }
  const [rows, count] = await Promise.all([
    prisma.researchNotification.findMany({
      where, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize, take: pageSize + 1,
      select: { id: true, projectId: true, projectTitle: true, kind: true, message: true, createdAt: true, readAt: true },
    }),
    prisma.researchNotification.count({ where: unreadWhere }),
  ]);
  return NextResponse.json({ items: rows.slice(0, pageSize), unread: count, hasMore: rows.length > pageSize });
}

export async function PATCH(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const parsed = readAction.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 400 });
  await prisma.researchNotification.updateMany({
    where: { recipientId: context.profile.id, readAt: null, ...(parsed.data.action === "read" ? { id: parsed.data.id } : {}) },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
