import { progressFromStage, stages } from "@/lib/research-types";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ProfileCapability } from "@/generated/prisma/client";
import { getProfileForRequest } from "@/lib/server-access";
import { prisma } from "@/lib/prisma";
import { projectInclude, toResearchItem } from "@/lib/research-data";
import { canManageProjects, hasCapability } from "@/lib/roles";

const reviewStatuses = ["ยังไม่ส่งตรวจ", "ส่งตรวจ", "ขอแก้ไข", "อนุมัติ"] as const;
const response = (status: number, message: string) => NextResponse.json({ error: message }, { status });
const validDate = (value: unknown) => {
  if (value === undefined || value === null || value === "") return { valid: true, date: null as Date | null };
  if (typeof value !== "string") return { valid: false, date: null };
  const date = new Date(`${value}T00:00:00.000Z`);
  return { valid: !Number.isNaN(date.valueOf()), date };
};

export async function POST(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return response(401, "Sign in to continue.");
  if (context.profile.systemRole !== "PM") return response(403, "เฉพาะ PM ที่สร้างโครงการและเลือกที่ปรึกษาได้");

  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim() || typeof body.adviseeId !== "string" || typeof body.primaryAdvisorId !== "string" || !Array.isArray(body.secondaryAdvisorIds)) {
    return response(400, "A title, advisee, one primary advisor, and a secondary advisor list are required.");
  }
  const secondaryAdvisorIds = [...new Set<string>(body.secondaryAdvisorIds.filter((id: unknown): id is string => typeof id === "string"))];
  if (secondaryAdvisorIds.includes(body.primaryAdvisorId)) return response(400, "The primary advisor cannot also be listed as a secondary advisor.");
  const advisorIds = [body.primaryAdvisorId, ...secondaryAdvisorIds];
  const [advisee, advisors] = await Promise.all([
    prisma.researchProfile.findFirst({ where: { id: body.adviseeId, active: true, capabilities: { some: { capability: ProfileCapability.ADVISEE } } } }),
    prisma.researchProfile.findMany({ where: { id: { in: advisorIds }, active: true, capabilities: { some: { capability: ProfileCapability.ADVISOR } } }, select: { id: true } }),
  ]);
  if (!advisee || advisors.length !== advisorIds.length) return response(400, "Choose active users with the required Advisee and Advisor access.");
  const due = validDate(body.dueDate);
  if (!due.valid) return response(400, "Enter a valid due date.");

  const project = await prisma.researchProject.create({
    data: {
      projectCode: `R-${randomBytes(4).toString("hex").toUpperCase()}`,
      title: body.title.trim(),
      titleHistory: { create: { version: 1, title: body.title.trim(), author: context.profile.fullName, createdAt: new Date() } },
      faculty: typeof body.faculty === "string" ? body.faculty.trim() : null,
      dueDate: due.date,
      adviseeId: advisee.id,
      advisors: {
        create: advisorIds.map((advisorId) => ({ advisorId, assignmentType: advisorId === body.primaryAdvisorId ? "PRIMARY" : "SECONDARY" })),
      },
      reviews: { create: advisorIds.map((advisorId) => ({ advisorId, status: reviewStatuses[0], updatedAt: new Date() })) },
      updates: { create: { actorId: context.profile.id, summary: "Created research project" } },
    },
    include: projectInclude(),
  });
  return NextResponse.json({ project: toResearchItem(project) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getProfileForRequest(request.headers);
  if (!context) return response(401, "Sign in to continue.");
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string") return response(400, "Project not found.");

  const project = await prisma.researchProject.findUnique({
    where: { id: body.id },
    include: { advisors: { select: { advisorId: true, assignmentType: true } } },
  });
  if (!project) return response(404, "Project not found.");

  const { profile, activeMode } = context;
  const manager = canManageProjects(profile.systemRole);
  const isAdvisee = activeMode === ProfileCapability.ADVISEE && project.adviseeId === profile.id;
  const isAdvisor = activeMode === ProfileCapability.ADVISOR && project.advisors.some((advisor) => advisor.advisorId === profile.id);
  if (!manager && !isAdvisee && !isAdvisor) return response(403, "You do not have access to this research project.");

  const allowed = ["stage", "issue", "nextTask", "notes", "dueDate", "review", "comment", "primaryAdvisorId", "secondaryAdvisorIds"];
  if (Object.keys(body).some((key) => key !== "id" && !allowed.includes(key))) return response(400, "The request includes an unsupported field.");
  if (isAdvisor && !manager && Object.keys(body).some((key) => key !== "id" && key !== "review" && key !== "comment")) {
    return response(403, "Advisor access can only update an assigned review and comment.");
  }
  if (isAdvisee && !manager && ("review" in body || "comment" in body)) return response(403, "Advisee access cannot edit advisor reviews or comments.");
  if (("primaryAdvisorId" in body || "secondaryAdvisorIds" in body) && profile.systemRole !== "PM") return response(403, "เฉพาะ PM ที่แก้ไขที่ปรึกษาหลักและที่ปรึกษารองได้");

  const changes: { stage?: number; stageProgress?: number; issue?: string; nextTask?: string; notes?: string; dueDate?: Date | null } = {};
  const summaries: string[] = [];
  if ("stage" in body) {
    if (!Number.isInteger(body.stage) || body.stage < 0 || body.stage >= stages.length) return response(400, "Stage must be between 0 and 7.");
    changes.stage = body.stage;
    changes.stageProgress = progressFromStage(body.stage);
    summaries.push(`Changed stage to ${body.stage}`);
  }
  for (const field of ["issue", "nextTask", "notes"] as const) {
    if (!(field in body)) continue;
    if (typeof body[field] !== "string" || body[field].length > 4000) return response(400, `Invalid ${field}.`);
    changes[field] = body[field].trim();
    summaries.push(`Updated ${field === "issue" ? "project issue" : field === "notes" ? "project notes" : "current results"}`);
  }
  if ("dueDate" in body) {
    const due = validDate(body.dueDate);
    if (!due.valid) return response(400, "Enter a valid due date.");
    changes.dueDate = due.date;
    summaries.push("Updated due date");
  }

  const assignmentChanged = "primaryAdvisorId" in body || "secondaryAdvisorIds" in body;
  let primaryAdvisorId = project.advisors.find((advisor) => advisor.assignmentType === "PRIMARY")?.advisorId ?? "";
  let secondaryAdvisorIds = project.advisors.filter((advisor) => advisor.assignmentType === "SECONDARY").map((advisor) => advisor.advisorId);
  if (assignmentChanged) {
    primaryAdvisorId = typeof body.primaryAdvisorId === "string" ? body.primaryAdvisorId : primaryAdvisorId;
    if ("secondaryAdvisorIds" in body) {
      if (!Array.isArray(body.secondaryAdvisorIds) || body.secondaryAdvisorIds.some((id: unknown) => typeof id !== "string")) return response(400, "Invalid secondary advisor list.");
      secondaryAdvisorIds = [...new Set<string>(body.secondaryAdvisorIds)];
    }
    if (!primaryAdvisorId || secondaryAdvisorIds.includes(primaryAdvisorId)) return response(400, "Choose one primary advisor and do not duplicate that advisor as secondary.");
    const advisorIds = [primaryAdvisorId, ...secondaryAdvisorIds];
    const validAdvisors = await prisma.researchProfile.findMany({
      where: { id: { in: advisorIds }, active: true, capabilities: { some: { capability: ProfileCapability.ADVISOR } } },
      select: { id: true },
    });
    if (validAdvisors.length !== advisorIds.length) return response(400, "All assigned advisors must be active Advisor users.");
    summaries.push("Updated primary and secondary advisor assignments");
  }

  if ("review" in body) {
    if (!isAdvisor || !hasCapability(profile.capabilities, ProfileCapability.ADVISOR)) return response(403, "Only an assigned Advisor can update their own review.");
    if (typeof body.review !== "string" || !reviewStatuses.includes(body.review as (typeof reviewStatuses)[number])) return response(400, "Invalid review status.");
    summaries.push(`Updated advisor review to ${body.review}`);
  }
  if ("comment" in body) {
    if (!isAdvisor || !hasCapability(profile.capabilities, ProfileCapability.ADVISOR)) return response(403, "Only an assigned Advisor can add a review comment.");
    if (typeof body.comment !== "string" || !body.comment.trim() || body.comment.length > 4000) return response(400, "Enter a valid comment.");
  }

  await prisma.$transaction(async (tx) => {
    if (assignmentChanged) {
      const advisorIds = [primaryAdvisorId, ...secondaryAdvisorIds];
      await tx.researchProjectAdvisor.deleteMany({ where: { projectId: project.id } });
      await tx.researchProjectAdvisor.createMany({
        data: advisorIds.map((advisorId) => ({ projectId: project.id, advisorId, assignmentType: advisorId === primaryAdvisorId ? "PRIMARY" : "SECONDARY" })),
      });
      await Promise.all(advisorIds.map((advisorId) => tx.advisorReview.upsert({
        where: { projectId_advisorId: { projectId: project.id, advisorId } },
        create: { projectId: project.id, advisorId, status: reviewStatuses[0], updatedAt: new Date() },
        update: {},
      })));
      await tx.advisorReview.deleteMany({ where: { projectId: project.id, advisorId: { notIn: advisorIds } } });
    }
    if ("review" in body) {
      await tx.advisorReview.upsert({
        where: { projectId_advisorId: { projectId: project.id, advisorId: profile.id } },
        create: { projectId: project.id, advisorId: profile.id, status: body.review, updatedAt: new Date() },
        update: { status: body.review, updatedAt: new Date() },
      });
    }
    if (Object.keys(changes).length) await tx.researchProject.update({ where: { id: project.id }, data: changes });
    if (summaries.length) await tx.researchUpdate.create({ data: { projectId: project.id, actorId: profile.id, summary: summaries.join(" · ") } });
    if ("comment" in body) {
      await tx.advisorComment.create({ data: { projectId: project.id, authorId: profile.id, body: body.comment.trim() } });
      await tx.researchUpdate.create({ data: { projectId: project.id, actorId: profile.id, summary: "Added advisor comment" } });
    }
  });

  const updated = await prisma.researchProject.findUnique({ where: { id: project.id }, include: projectInclude() });
  return NextResponse.json({ ok: true, ...(updated ? { project: toResearchItem(updated, isAdvisor ? profile.id : undefined) } : {}) });
}
