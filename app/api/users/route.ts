import { NextResponse } from "next/server";
import { ProfileCapability, SystemRole, type Prisma } from "@/generated/prisma/client";
import { getProfileForRequest } from "@/lib/server-access";
import { cidLookupKeyFromCid, providerEmailAlias } from "@/lib/provider-id";
import { canManageSystemRoles, canManageUsers } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { profileFileHref } from "@/lib/storage";

const capabilities = [ProfileCapability.ADVISOR, ProfileCapability.ADVISEE] as const;
const systemRoles = [SystemRole.USER, SystemRole.PM, SystemRole.SUPERADMIN] as const;
const isCapability = (value: unknown): value is ProfileCapability => typeof value === "string" && capabilities.includes(value as ProfileCapability);
const isSystemRole = (value: unknown): value is SystemRole => typeof value === "string" && systemRoles.includes(value as SystemRole);
const uniqueError = (error: unknown) => Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DirectoryRecord = Prisma.ResearchProfileGetPayload<{ include: { capabilities: true } }>;

async function requireManager(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!canManageUsers(context.profile.systemRole)) return { error: NextResponse.json({ error: "Only PM or Superadmin can manage the user directory." }, { status: 403 }) };
  return { context };
}

function personResponse(person: DirectoryRecord) {
  return {
    id: person.id,
    providerId: person.providerId,
    cidRegistered: Boolean(person.cidLookupKey),
    name: person.fullName,
    fullName: person.fullName,
    email: person.email ?? "",
    systemRole: person.systemRole,
    capabilities: person.capabilities.map((grant) => grant.capability),
    active: person.active,
    userId: person.userId,
    position: person.position,
    positionLevel: person.positionLevel,
    mission: person.mission,
    workGroup: person.workGroup,
    avatarUrl: profileFileHref(person.id, "avatar", person.avatarPath),
    signatureUrl: profileFileHref(person.id, "signature", person.signaturePath),
  };
}

function parseCapabilities(value: unknown) {
  if (!Array.isArray(value) || value.some((entry) => !isCapability(entry))) return null;
  return [...new Set(value as ProfileCapability[])];
}

export async function GET(request: Request) {
  const access = await requireManager(request);
  if (access.error) return access.error;
  const people = await prisma.researchProfile.findMany({
    include: { capabilities: true },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json({ people: await Promise.all(people.map(personResponse)) });
}

export async function POST(request: Request) {
  const access = await requireManager(request);
  if (access.error) return access.error;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const cid = typeof body?.cid === "string" ? body.cid : "";
  const cidLookupKey = cidLookupKeyFromCid(cid);
  const selectedCapabilities = parseCapabilities(body?.capabilities ?? [ProfileCapability.ADVISEE]);
  const role = body?.systemRole === undefined ? SystemRole.USER : body.systemRole;
  if (!fullName || fullName.length > 160 || !cidLookupKey || !selectedCapabilities || !isSystemRole(role)) {
    return NextResponse.json({ error: "Enter a valid 13-digit CID, full name, system role, and capability list." }, { status: 400 });
  }
  if (!canManageSystemRoles(access.context.profile.systemRole) && role !== SystemRole.USER) {
    return NextResponse.json({ error: "PM can only create regular users. Superadmin assigns PM and Superadmin roles." }, { status: 403 });
  }
  if (role === SystemRole.USER && selectedCapabilities.length === 0) {
    return NextResponse.json({ error: "A regular user must have at least one work capability." }, { status: 400 });
  }
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim().toLowerCase() : null;
  if (email && !emailPattern.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (email && await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "That email is already used by a linked account." }, { status: 409 });
  }

  try {
    const person = await prisma.researchProfile.create({
      data: {
        cidLookupKey,
        emailAlias: providerEmailAlias(`cid:${cidLookupKey}`),
        email,
        fullName,
        systemRole: role,
        position: typeof body.position === "string" ? body.position.trim() : "",
        positionLevel: typeof body.positionLevel === "string" ? body.positionLevel.trim() : "",
        mission: typeof body.mission === "string" ? body.mission.trim() : "",
        workGroup: typeof body.workGroup === "string" ? body.workGroup.trim() : "",
        capabilities: { create: selectedCapabilities.map((capability) => ({ capability })) },
      },
      include: { capabilities: true },
    });
    return NextResponse.json({ person: personResponse(person) }, { status: 201 });
  } catch (error) {
    if (uniqueError(error)) return NextResponse.json({ error: "The CID or email is already registered." }, { status: 409 });
    throw error;
  }
}

export async function PATCH(request: Request) {
  const access = await requireManager(request);
  if (access.error) return access.error;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string") return NextResponse.json({ error: "User not found." }, { status: 400 });
  const target = await prisma.researchProfile.findUnique({ where: { id: body.id }, include: { capabilities: true } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  const actor = access.context.profile;
  const isSuperadmin = canManageSystemRoles(actor.systemRole);
  if (target.systemRole !== SystemRole.USER && !isSuperadmin) return NextResponse.json({ error: "Only Superadmin can manage PM or Superadmin accounts." }, { status: 403 });

  const data: Prisma.ResearchProfileUpdateInput = {};
  let nextCapabilities: ProfileCapability[] | undefined;
  let nextSystemRole: SystemRole | undefined;
  let nextEmail: string | undefined;

  if (body.systemRole !== undefined) {
    if (!isSuperadmin) return NextResponse.json({ error: "Only Superadmin can assign PM or Superadmin access." }, { status: 403 });
    if (!isSystemRole(body.systemRole)) return NextResponse.json({ error: "Invalid system role." }, { status: 400 });
    nextSystemRole = body.systemRole;
    data.systemRole = nextSystemRole;
  }
  if (body.capabilities !== undefined) {
    nextCapabilities = parseCapabilities(body.capabilities) ?? undefined;
    if (!nextCapabilities) return NextResponse.json({ error: "Invalid capabilities." }, { status: 400 });
  }
  const resultingSystemRole = nextSystemRole ?? target.systemRole;
  const resultingCapabilities = nextCapabilities ?? target.capabilities.map((grant) => grant.capability);
  if (resultingSystemRole === SystemRole.USER && resultingCapabilities.length === 0) {
    return NextResponse.json({ error: "A regular user must have at least one work capability." }, { status: 400 });
  }
  for (const field of ["fullName", "position", "positionLevel", "mission", "workGroup"] as const) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "string" || body[field].trim().length > 160 || (field === "fullName" && !body[field].trim())) {
      return NextResponse.json({ error: `Invalid ${field}.` }, { status: 400 });
    }
    data[field] = body[field].trim();
  }
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") return NextResponse.json({ error: "Invalid account status." }, { status: 400 });
    data.active = body.active;
  }
  if (body.cid !== undefined) {
    if (target.userId) return NextResponse.json({ error: "CID is locked after the account is linked." }, { status: 409 });
    if (typeof body.cid !== "string") return NextResponse.json({ error: "Invalid CID." }, { status: 400 });
    const cidLookupKey = cidLookupKeyFromCid(body.cid);
    if (!cidLookupKey) return NextResponse.json({ error: "Enter a valid Thai 13-digit CID." }, { status: 400 });
    data.cidLookupKey = cidLookupKey;
  }
  if (body.email !== undefined) {
    if (!isSuperadmin && target.systemRole !== SystemRole.USER) return NextResponse.json({ error: "Only Superadmin can change this email." }, { status: 403 });
    if (typeof body.email !== "string" || !emailPattern.test(body.email.trim())) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    nextEmail = body.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: nextEmail }, select: { id: true } });
    if (existingUser && existingUser.id !== target.userId) return NextResponse.json({ error: "That email is already used by another account." }, { status: 409 });
    const existingProfile = await prisma.researchProfile.findUnique({ where: { email: nextEmail }, select: { id: true } });
    if (existingProfile && existingProfile.id !== target.id) return NextResponse.json({ error: "That email is already assigned to another profile." }, { status: 409 });
    data.email = nextEmail;
  }

  const removesAdvisor = Boolean(nextCapabilities && target.capabilities.some((grant) => grant.capability === ProfileCapability.ADVISOR) && !nextCapabilities.includes(ProfileCapability.ADVISOR));
  const removesAdvisee = Boolean(nextCapabilities && target.capabilities.some((grant) => grant.capability === ProfileCapability.ADVISEE) && !nextCapabilities.includes(ProfileCapability.ADVISEE));
  const [advisorAssignments, adviseeProjects] = await Promise.all([
    removesAdvisor || data.active === false ? prisma.researchProjectAdvisor.count({ where: { advisorId: target.id } }) : Promise.resolve(0),
    removesAdvisee || data.active === false ? prisma.researchProject.count({ where: { adviseeId: target.id } }) : Promise.resolve(0),
  ]);
  if (removesAdvisor && advisorAssignments > 0) return NextResponse.json({ error: "Reassign this user's research projects before removing Advisor access." }, { status: 409 });
  if (removesAdvisee && adviseeProjects > 0) return NextResponse.json({ error: "Move this user's research projects before removing Advisee access." }, { status: 409 });
  if (data.active === false && (advisorAssignments > 0 || adviseeProjects > 0)) {
    return NextResponse.json({ error: "Reassign or move this user's research projects before deactivating the account." }, { status: 409 });
  }

  if (target.systemRole === SystemRole.SUPERADMIN && target.active && ((data.active === false) || (nextSystemRole && nextSystemRole !== SystemRole.SUPERADMIN))) {
    const activeAdmins = await prisma.researchProfile.count({ where: { systemRole: SystemRole.SUPERADMIN, active: true } });
    if (activeAdmins <= 1) return NextResponse.json({ error: "At least one active Superadmin must remain." }, { status: 400 });
  }
  if (target.id === actor.id && data.active === false) return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
  if (Object.keys(data).length === 0 && nextCapabilities === undefined) return NextResponse.json({ error: "No changes provided." }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      if (nextEmail && target.userId) {
        await tx.user.update({ where: { id: target.userId }, data: { email: nextEmail, emailVerified: false } });
      }
      await tx.researchProfile.update({ where: { id: target.id }, data });
      if (nextCapabilities) {
        await tx.profileCapabilityGrant.deleteMany({ where: { profileId: target.id } });
        if (nextCapabilities.length) {
          await tx.profileCapabilityGrant.createMany({ data: nextCapabilities.map((capability) => ({ profileId: target.id, capability })) });
        }
      }
      if (target.userId && data.active === false) {
        await tx.session.deleteMany({ where: { userId: target.userId } });
      } else if (target.userId && nextCapabilities) {
        await tx.session.updateMany({ where: { userId: target.userId }, data: { activeMode: null } });
      }
    });
  } catch (error) {
    if (uniqueError(error)) return NextResponse.json({ error: "The CID or email is already registered." }, { status: 409 });
    throw error;
  }

  const updated = await prisma.researchProfile.findUnique({ where: { id: target.id }, include: { capabilities: true } });
  if (!updated) return NextResponse.json({ error: "Could not load updated user." }, { status: 500 });
  return NextResponse.json({ person: personResponse(updated) });
}
