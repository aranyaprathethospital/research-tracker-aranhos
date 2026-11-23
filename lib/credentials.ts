import "server-only";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type Db = Pick<Prisma.TransactionClient, "account">;

export async function saveCredentialPassword(userId: string, password: string, db: Db = prisma) {
  const passwordHash = await hashPassword(password);
  const existing = await db.account.findFirst({ where: { userId, providerId: "credential" }, select: { id: true } });
  if (existing) {
    await db.account.update({ where: { id: existing.id }, data: { password: passwordHash } });
    return;
  }
  await db.account.create({
    data: {
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    },
  });
}
