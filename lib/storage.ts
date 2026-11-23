import "server-only";

const bucket = "research-profile-files";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY to enable profile file storage.");
  }
  return { url, key };
}

function storagePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function uploadProfileFile(path: string, bytes: ArrayBuffer, contentType: string) {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/${bucket}/${storagePath(path)}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "Cache-Control": "max-age=3600",
      "x-upsert": "true",
    },
    body: bytes,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase Storage upload failed (${response.status}).`);
}

export async function createProfileFileUrl(path: string, expiresIn = 3600) {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/sign/${bucket}/${storagePath(path)}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
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
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}
