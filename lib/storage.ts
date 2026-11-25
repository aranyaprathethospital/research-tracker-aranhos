import "server-only";
import { env } from "@/lib/env";

const bucket = "research-profile-files";

function config() {
  const url = env.SUPABASE_URL?.replace(/\/$/, "");
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY to enable profile file storage.");
  }
  return { url, key };
}

function storagePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function storageHeaders(key: string) {
  return {
    apikey: key,
    ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }),
  };
}

export async function uploadProfileFile(path: string, bytes: ArrayBuffer, contentType: string, maxAge = 3600) {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/${bucket}/${storagePath(path)}`, {
    method: "POST",
    headers: {
      ...storageHeaders(key),
      "Content-Type": contentType,
      "Cache-Control": `max-age=${maxAge}`,
      "x-upsert": "true",
    },
    body: bytes,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Supabase Storage upload failed (${response.status}).`);
}

export async function removeProfileFiles(paths: string[]) {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers: { ...storageHeaders(key), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Supabase Storage cleanup failed (${response.status}).`);
}

export async function createProfileFileUrl(path: string, expiresIn = 3600) {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/sign/${bucket}/${storagePath(path)}`, {
    method: "POST",
    headers: {
      ...storageHeaders(key),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => null) as { signedURL?: string; signedUrl?: string } | null;
  if (!response.ok) throw new Error(`Supabase Storage signing failed (${response.status}).`);
  const signed = result?.signedURL ?? result?.signedUrl;
  if (!signed) throw new Error("Supabase Storage did not return a signed URL.");
  if (/^https?:\/\//i.test(signed)) return signed;
  const relative = signed.startsWith("/") ? signed : `/${signed}`;
  return relative.startsWith("/storage/v1/")
    ? `${url}${relative}`
    : `${url}/storage/v1${relative}`;
}

export function profileStorageConfigured() {
  return Boolean(env.SUPABASE_URL && (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY));
}

export function profileFileHref(profileId: string, kind: "avatar" | "signature", path: string | null) {
  return path && profileStorageConfigured()
    ? `/api/profile/files/${encodeURIComponent(profileId)}/${kind}`
    : null;
}
