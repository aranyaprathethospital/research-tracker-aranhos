import { NextResponse } from "next/server";
import { getProfileForRequest } from "@/lib/server-access";
import { prisma } from "@/lib/prisma";
import { uploadProfileFile } from "@/lib/storage";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

  const path = `${context.profile.id}/${kind}.${extensions[file.type]}`;
  try {
    await uploadProfileFile(path, await file.arrayBuffer(), file.type);
    await prisma.researchProfile.update({
      where: { id: context.profile.id },
      data: kind === "avatar" ? { avatarPath: path } : { signaturePath: path },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload the file.";
    const status = message.includes("Set SUPABASE_URL") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
