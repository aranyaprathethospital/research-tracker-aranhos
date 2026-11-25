import { NextResponse } from "next/server";
import { getProfileForRequest } from "@/lib/server-access";
import { prisma } from "@/lib/prisma";
import { profileFileHref } from "@/lib/storage";

export async function GET(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const people = await prisma.researchProfile.findMany({
    where: { active: true },
    select: {
      id: true,
      fullName: true,
      systemRole: true,
      capabilities: { select: { capability: true } },
      position: true,
      positionLevel: true,
      mission: true,
      workGroup: true,
      avatarPath: true,
      signaturePath: true,
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({
    people: people.map((person) => ({
      id: person.id,
      name: person.fullName,
      systemRole: person.systemRole,
      capabilities: person.capabilities.map((grant) => grant.capability),
      position: person.position,
      positionLevel: person.positionLevel,
      mission: person.mission,
      workGroup: person.workGroup,
      avatarUrl: profileFileHref(person.id, "avatar", person.avatarPath),
      signatureUrl: profileFileHref(person.id, "signature", person.signaturePath),
    })),
  });
}
