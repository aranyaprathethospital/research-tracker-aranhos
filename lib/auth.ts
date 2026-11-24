import "server-only";
import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { genericOAuth } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { cidLookupKeyFromMophHash, isProviderIdConfigured, providerIdConfig } from "@/lib/provider-id";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

type JsonRecord = Record<string, unknown>;
const asRecord = (value: unknown): JsonRecord => value && typeof value === "object" ? value as JsonRecord : {};
const nestedData = (value: unknown) => asRecord(asRecord(value).data);

const moph = providerIdConfig();
const providerEnabled = isProviderIdConfigured();
// Keep local development buildable without committing a reusable auth secret.
const authSecret = process.env.BETTER_AUTH_SECRET ?? randomBytes(32).toString("base64url");

const providerPlugin = providerEnabled ? genericOAuth({
  config: [{
    providerId: "provider-id",
    name: "MOPH ProviderID",
    clientId: moph.healthClientId!,
    clientSecret: moph.healthClientSecret!,
    authorizationUrl: `${moph.healthBaseUrl}/oauth/redirect`,
    tokenUrl: `${moph.healthBaseUrl}/api/v1/token`,
    redirectURI: moph.redirectUri,
    responseType: "code",
    pkce: false,
    getToken: async ({ code, redirectURI }) => {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectURI,
        client_id: moph.healthClientId!,
        client_secret: moph.healthClientSecret!,
      });
      const response = await fetch(`${moph.healthBaseUrl}/api/v1/token`, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store", signal: AbortSignal.timeout(15_000),
      });
      const payload = await response.json().catch(() => null);
      const data = nestedData(payload);
      const accessToken = data.access_token;
      if (!response.ok || typeof accessToken !== "string" || !accessToken) throw new Error("Health ID code exchange failed");
      const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
      return { accessToken, tokenType: typeof data.token_type === "string" ? data.token_type : "Bearer", accessTokenExpiresAt: new Date(Date.now() + expiresIn * 1000), scopes: [], raw: { healthIdAccessToken: accessToken } };
    },
    getUserInfo: async (tokens) => {
      const healthAccessToken = tokens.raw?.healthIdAccessToken;
      if (typeof healthAccessToken !== "string" || !healthAccessToken) return null;
      const providerTokenResponse = await fetch(`${moph.providerBaseUrl}/api/v1/services/token`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: moph.providerClientId, secret_key: moph.providerSecret, token_by: "Health ID", token: healthAccessToken }),
        cache: "no-store", signal: AbortSignal.timeout(15_000),
      });
      const providerPayload = await providerTokenResponse.json().catch(() => null);
      const providerToken = nestedData(providerPayload).access_token;
      if (!providerTokenResponse.ok || typeof providerToken !== "string" || !providerToken) return null;
      const profileResponse = await fetch(`${moph.providerBaseUrl}/api/v1/services/profile`, {
        method: "GET", headers: {
          Authorization: `Bearer ${providerToken}`,
          "Content-Type": "application/json",
          "client-id": moph.providerClientId!,
          "secret-key": moph.providerSecret!,
        }, cache: "no-store", signal: AbortSignal.timeout(15_000),
      });
      const profilePayload = await profileResponse.json().catch(() => null);
      const profile = nestedData(profilePayload);
      const providerId = profile.provider_id;
      const cidLookupKey = cidLookupKeyFromMophHash(profile.hash_cid);
      if (!profileResponse.ok || typeof providerId !== "string" || !providerId || !cidLookupKey) return null;

      // A directory record with this CID must exist before login. Never create
      // or assign a role during OAuth; the role comes only from the database.
      const existing = await prisma.researchProfile.findUnique({
        where: { cidLookupKey },
        select: { id: true, providerId: true, emailAlias: true, active: true, fullName: true },
      });
      if (!existing?.active) return null;

      const conflictingProviderId = await prisma.researchProfile.findUnique({ where: { providerId }, select: { id: true } });
      if (conflictingProviderId && conflictingProviderId.id !== existing.id) return null;
      if (existing.providerId !== providerId) {
        await prisma.researchProfile.update({ where: { id: existing.id }, data: { providerId } });
      }
      return { id: providerId, email: existing.emailAlias, name: existing.fullName || (typeof profile.name_th === "string" ? profile.name_th : "ผู้ใช้ ProviderID"), emailVerified: true };
    },
  }],
}) : null;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: authSecret,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
  },
  plugins: providerPlugin ? [providerPlugin] : [],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const invite = await prisma.researchProfile.findUnique({ where: { emailAlias: user.email }, select: { active: true, userId: true, cidLookupKey: true } });
          if (!invite?.active || !invite.cidLookupKey || invite.userId) return false;
        },
        after: async (user) => {
          await prisma.researchProfile.updateMany({ where: { emailAlias: user.email, userId: null, active: true }, data: { userId: user.id } });
        },
      },
    },
    account: {
      create: { after: async (account) => {
        // The MOPH tokens are needed only during the server-side identity exchange.
        await prisma.account.updateMany({ where: { id: account.id }, data: { accessToken: null, refreshToken: null, idToken: null } });
      } },
      update: { after: async (account) => {
        await prisma.account.updateMany({ where: { id: account.id }, data: { accessToken: null, refreshToken: null, idToken: null } });
      } },
    },
  },
});
