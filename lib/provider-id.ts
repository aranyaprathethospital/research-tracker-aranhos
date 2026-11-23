import "server-only";
import { createHash, createHmac } from "node:crypto";

export function providerEmailAlias(providerId: string) {
  const digest = createHash("sha256").update(providerId).digest("hex").slice(0, 32);
  return `provider-${digest}@identity.invalid`;
}

export function normalizeThaiCid(value: string) {
  const cid = value.replace(/[\s-]/g, "");
  if (!/^\d{13}$/.test(cid)) return null;
  const sum = [...cid.slice(0, 12)].reduce((total, digit, index) => total + Number(digit) * (13 - index), 0);
  if ((11 - (sum % 11)) % 10 !== Number(cid[12])) return null;
  return cid;
}

function cidLookupSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("BETTER_AUTH_SECRET must be configured to look up CID records");
  return secret;
}

// MOPH's ProviderID profile returns hash_cid (SHA-256 of the CID). We HMAC that
// value with the server-only auth secret so a database-only leak cannot be
// reversed into a CID. Keep BETTER_AUTH_SECRET stable while these records exist.
export function cidLookupKeyFromCid(value: string) {
  const cid = normalizeThaiCid(value);
  if (!cid) return null;
  const mophHashCid = createHash("sha256").update(cid).digest("hex");
  return createHmac("sha256", cidLookupSecret()).update(mophHashCid).digest("hex");
}

export function cidLookupKeyFromMophHash(value: unknown) {
  if (typeof value !== "string" || !/^[a-f\d]{64}$/i.test(value)) return null;
  return createHmac("sha256", cidLookupSecret()).update(value.toLowerCase()).digest("hex");
}

export function providerIdConfig() {
  const environment = process.env.MOPH_ENV === "PRD" ? "PRD" : "UAT";
  const healthBaseUrl = environment === "PRD" ? "https://moph.id.th" : "https://uat-moph.id.th";
  const providerBaseUrl = environment === "PRD" ? "https://provider.id.th" : "https://uat-provider.id.th";
  return {
    environment,
    healthBaseUrl,
    providerBaseUrl,
    healthClientId: process.env.MOPH_HEALTH_ID_CLIENT_ID,
    healthClientSecret: process.env.MOPH_HEALTH_ID_CLIENT_SECRET,
    providerClientId: process.env.MOPH_PROVIDER_ID_CLIENT_ID,
    providerSecret: process.env.MOPH_PROVIDER_ID_SECRET_KEY,
    redirectUri: process.env.MOPH_REDIRECT_URI ?? `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/callback/provider-id`,
  };
}

export function isProviderIdConfigured() {
  const config = providerIdConfig();
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET && config.healthClientId && config.healthClientSecret && config.providerClientId && config.providerSecret);
}
