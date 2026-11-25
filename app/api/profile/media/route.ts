import { NextResponse } from "next/server";
import { getProfileForRequest } from "@/lib/server-access";
import { prisma } from "@/lib/prisma";
import { removeProfileFiles, uploadProfileFile } from "@/lib/storage";
import type { Prisma } from "@/generated/prisma/client";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function lockAvatar(tx: Prisma.TransactionClient, id: string) {
  const [profile] = await tx.$queryRaw<{ avatarPath: string | null }[]>`
    SELECT "avatarPath" FROM "ResearchProfile" WHERE id = ${id} FOR UPDATE
  `;
  if (!profile) throw new Error("Profile not found.");
  return profile;
}

export async function POST(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const kind = form?.get("kind");
  const file = form?.get("file");
  if ((kind !== "avatar" && kind !== "signature") || !(file instanceof File)) {
    return NextResponse.json({ error: "Choose a profile photo or signature image." }, { status: 400 });
  }
  if (!extensions[file.type] || file.size < 1 || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image up to 5 MB." }, { status: 400 });
  }

  const folder = context.profile.id;
  const path = kind === "avatar" ? `${folder}/avatar` : `${folder}/signature.${extensions[file.type]}`;
  try {
    const bytes = await file.arrayBuffer();
    if (kind === "avatar") {
      await prisma.$transaction(async (tx) => {
        await lockAvatar(tx, folder);
        await uploadProfileFile(path, bytes, file.type, 0);
        await tx.researchProfile.update({ where: { id: folder }, data: { avatarPath: path } });
      }, { timeout: 15_000 });
      // Only remove paths used by the previous avatar naming scheme.
      const legacyAvatars = Object.values(extensions).map((extension) => `${folder}/avatar.${extension}`);
      await removeProfileFiles(legacyAvatars).catch((error: unknown) => {
        console.warn("Could not clean up previous profile pictures.", error);
      });
    } else {
      await uploadProfileFile(path, bytes, file.type);
      await prisma.researchProfile.update({ where: { id: folder }, data: { signaturePath: path } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload the file.";
    const status = message.includes("Set SUPABASE_URL") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const id = context.profile.id;
  try {
    await prisma.$transaction(async (tx) => {
      const { avatarPath } = await lockAvatar(tx, id);
      if (!avatarPath) return;
      if (!avatarPath.startsWith(`${id}/`)) throw new Error("Invalid profile picture path.");
      await removeProfileFiles([avatarPath]);
      await tx.researchProfile.update({ where: { id }, data: { avatarPath: null } });
    }, { timeout: 15_000 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ลบรูปโปรไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง" }, { status: 502 });
  }
}
