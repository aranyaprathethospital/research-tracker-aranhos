import "server-only";
import type { Research, ReviewStatus } from "@/lib/research-types";
import type { Prisma } from "@/generated/prisma/client";

export function projectInclude() {
  return {
    advisee: { select: { fullName: true } },
    advisors: { include: { advisor: { select: { fullName: true } } }, orderBy: { assignedAt: "asc" as const } },
    reviews: { orderBy: { updatedAt: "desc" as const } },
    comments: { include: { author: { select: { fullName: true } } }, orderBy: { createdAt: "desc" as const } },
    updates: { include: { actor: { select: { fullName: true } } }, orderBy: { createdAt: "desc" as const } },
  } satisfies Prisma.ResearchProjectInclude;
}

export type ProjectWithDetails = Prisma.ResearchProjectGetPayload<{ include: ReturnType<typeof projectInclude> }>;

export function toResearchItem(project: ProjectWithDetails, advisorId?: string): Research {
  const primary = project.advisors.find((entry) => entry.assignmentType === "PRIMARY");
  const selfReview = advisorId ? project.reviews.find((entry) => entry.advisorId === advisorId) : undefined;
  const isMyAdvisor = Boolean(advisorId && project.advisors.some((entry) => entry.advisorId === advisorId));
  const primaryReview = primary ? project.reviews.find((entry) => entry.advisorId === primary.advisorId) : undefined;
  const defaultReview = "ยังไม่ส่งตรวจ" as ReviewStatus;
  const primaryName = primary?.advisor.fullName ?? "";
  const secondary = project.advisors.filter((entry) => entry.assignmentType === "SECONDARY");
  const advisorReviews = project.advisors.map((entry) => ({
    id: entry.advisorId,
    advisor: entry.advisor.fullName,
    assignment: entry.assignmentType,
    status: (project.reviews.find((review) => review.advisorId === entry.advisorId)?.status ?? "ยังไม่ส่งตรวจ") as ReviewStatus,
  }));
  return {
    id: project.id,
    title: project.title,
    student: project.advisee.fullName,
    faculty: project.faculty ?? "",
    advisor: project.advisors.map((entry) => entry.advisor.fullName),
    primaryAdvisor: primaryName,
    secondaryAdvisors: secondary.map((entry) => entry.advisor.fullName),
    advisorReviews,
    myReview: isMyAdvisor ? (selfReview?.status ?? defaultReview) as ReviewStatus : undefined,
    isMyAdvisor: advisorId ? isMyAdvisor : undefined,
    stage: project.stage,
    progress: project.stageProgress,
    dueDate: project.dueDate?.toISOString().slice(0, 10) ?? "",
    issue: project.issue,
    nextTask: project.nextTask,
    review: (primaryReview?.status ?? defaultReview) as ReviewStatus,
    updatedAt: project.updatedAt.toISOString(),
    history: project.updates.map((entry) => ({ text: entry.summary, date: entry.createdAt.toISOString(), by: entry.actor.fullName })),
    comments: project.comments.map((entry) => ({ text: entry.body, date: entry.createdAt.toISOString(), by: entry.author.fullName })),
  };
}

