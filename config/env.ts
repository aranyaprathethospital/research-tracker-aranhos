import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const postgresUrl = z.url({ protocol: /^postgres(?:ql)?$/ });
const httpUrl = z.url({ protocol: /^https?$/ });
const authSecret = z.string().min(32);
const optionalText = z.string().trim().min(1).optional();

const validation = {
  emptyStringAsUndefined: true,
  onValidationError(issues: readonly { path?: readonly unknown[] }[]): never {
    const keys = [...new Set(issues.map((issue) => issue.path?.join(".") || "environment"))];
    throw new Error(`Invalid or missing environment variables: ${keys.join(", ")}`);
  },
};

export function readAppEnv() {
  return createEnv({
    ...validation,
    server: {
      NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
      DATABASE_URL: postgresUrl.optional(),
      BETTER_AUTH_URL: httpUrl.default("http://localhost:3000"),
      BETTER_AUTH_SECRET: authSecret.optional(),
      SUPABASE_URL: httpUrl.optional(),
      SUPABASE_SECRET_KEY: optionalText,
      SUPABASE_SERVICE_ROLE_KEY: optionalText,
      MOPH_ENV: z.enum(["UAT", "PRD"]).default("UAT"),
      MOPH_HEALTH_ID_CLIENT_ID: optionalText,
      MOPH_HEALTH_ID_CLIENT_SECRET: optionalText,
      MOPH_PROVIDER_ID_CLIENT_ID: optionalText,
      MOPH_PROVIDER_ID_SECRET_KEY: optionalText,
      MOPH_REDIRECT_URI: httpUrl.optional(),
    },
    runtimeEnv: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      MOPH_ENV: process.env.MOPH_ENV,
      MOPH_HEALTH_ID_CLIENT_ID: process.env.MOPH_HEALTH_ID_CLIENT_ID,
      MOPH_HEALTH_ID_CLIENT_SECRET: process.env.MOPH_HEALTH_ID_CLIENT_SECRET,
      MOPH_PROVIDER_ID_CLIENT_ID: process.env.MOPH_PROVIDER_ID_CLIENT_ID,
      MOPH_PROVIDER_ID_SECRET_KEY: process.env.MOPH_PROVIDER_ID_SECRET_KEY,
      MOPH_REDIRECT_URI: process.env.MOPH_REDIRECT_URI,
    },
  });
}

export function readPrismaEnv() {
  return createEnv({
    ...validation,
    server: { DIRECT_URL: postgresUrl.optional(), DATABASE_URL: postgresUrl.optional() },
    runtimeEnv: { DIRECT_URL: process.env.DIRECT_URL, DATABASE_URL: process.env.DATABASE_URL },
  });
}

export function readBootstrapEnv() {
  return createEnv({
    ...validation,
    server: {
      DIRECT_URL: postgresUrl,
      BETTER_AUTH_SECRET: authSecret,
      BOOTSTRAP_SUPERADMIN_CID: z.string().trim().min(1),
      BOOTSTRAP_SUPERADMIN_NAME: z.string().trim().min(1).max(160),
    },
    runtimeEnv: {
      DIRECT_URL: process.env.DIRECT_URL,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      BOOTSTRAP_SUPERADMIN_CID: process.env.BOOTSTRAP_SUPERADMIN_CID,
      BOOTSTRAP_SUPERADMIN_NAME: process.env.BOOTSTRAP_SUPERADMIN_NAME,
    },
  });
}
