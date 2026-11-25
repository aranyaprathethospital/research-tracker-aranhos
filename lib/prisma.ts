import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaCache?: { constructor: typeof PrismaClient; client: PrismaClient };
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/research_tracker?schema=public",
  });
  return new PrismaClient({ adapter });
}

const cached = globalForPrisma.prismaCache;

// A regenerated client can replace the constructor during a dev reload.
export const prisma = cached?.constructor === PrismaClient ? cached.client : createPrismaClient();
if (process.env.NODE_ENV === "development") {
  globalForPrisma.prismaCache = { constructor: PrismaClient, client: prisma };
}
