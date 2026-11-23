import { createHash, createHmac, randomUUID } from "node:crypto";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const cidInput = process.env.BOOTSTRAP_SUPERADMIN_CID ?? "";
const fullName = process.env.BOOTSTRAP_SUPERADMIN_NAME?.trim();
const authSecret = process.env.BETTER_AUTH_SECRET;
const connectionString = process.env.DIRECT_URL;

function normalizeCid(value) {
  const cid = value.replace(/[\s-]/g, "");
  if (!/^\d{13}$/.test(cid)) return null;
  const sum = [...cid.slice(0, 12)].reduce((total, digit, index) => total + Number(digit) * (13 - index), 0);
  return (11 - (sum % 11)) % 10 === Number(cid[12]) ? cid : null;
}

const cid = normalizeCid(cidInput);
if (!cid) throw new Error("BOOTSTRAP_SUPERADMIN_CID must be a valid 13-digit Thai CID");
if (!fullName) throw new Error("BOOTSTRAP_SUPERADMIN_NAME is required");
if (!authSecret || authSecret.length < 32) throw new Error("Set BETTER_AUTH_SECRET to a stable random value of at least 32 characters");
if (!connectionString) throw new Error("DIRECT_URL is required");

const mophHashCid = createHash("sha256").update(cid).digest("hex");
const cidLookupKey = createHmac("sha256", authSecret).update(mophHashCid).digest("hex");
const emailHash = createHash("sha256").update(`cid:${cidLookupKey}`).digest("hex").slice(0, 32);
const emailAlias = `provider-${emailHash}@identity.invalid`;
const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10000 });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext('research-tracker-initial-superadmin'))");
  const existingAdmins = await client.query(`SELECT count(*)::int AS count FROM public."ResearchProfile" WHERE "systemRole" = 'SUPERADMIN' AND "active" = true`);
  if (existingAdmins.rows[0].count > 0) throw new Error("An active Superadmin already exists; use the Superadmin directory instead");

  const existingProfile = await client.query(`SELECT "id" FROM public."ResearchProfile" WHERE "cidLookupKey" = $1 FOR UPDATE`, [cidLookupKey]);
  if (existingProfile.rowCount) {
    await client.query(
      `UPDATE public."ResearchProfile" SET "fullName" = $2, "systemRole" = 'SUPERADMIN', "active" = true, "updatedAt" = now() WHERE "id" = $1`,
      [existingProfile.rows[0].id, fullName],
    );
  } else {
    await client.query(
      `INSERT INTO public."ResearchProfile" ("id", "providerId", "cidLookupKey", "emailAlias", "fullName", "systemRole", "active", "userId", "createdAt", "updatedAt")
       VALUES ($1, NULL, $2, $3, $4, 'SUPERADMIN', true, NULL, now(), now())`,
      [randomUUID(), cidLookupKey, emailAlias, fullName],
    );
  }
  await client.query("COMMIT");
  console.log("Initial Superadmin CID allowlist entry created. Plain CID was not stored.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end().catch(() => {});
  delete process.env.BOOTSTRAP_SUPERADMIN_CID;
  delete process.env.BOOTSTRAP_SUPERADMIN_NAME;
}
