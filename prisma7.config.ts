import dotenv from "dotenv";
import { defineConfig } from "prisma/config";
import { readPrismaEnv } from "./config/env.ts";

dotenv.config({ path: ".env.local" });
dotenv.config();
const env = readPrismaEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Use the direct Supabase connection for Prisma CLI migrations.
    url:
      env.DIRECT_URL ??
      env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/research_tracker?schema=public",
  },
});
