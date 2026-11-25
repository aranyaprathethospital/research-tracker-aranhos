import { type Research } from "@/lib/research-types";

export type ResearchChanges = Partial<Research> & { primaryAdvisorId?: string; secondaryAdvisorIds?: string[] };

export type ProjectInput = Omit<Research, "id" | "faculty" | "titleVersion" | "titleHistory" | "adviseeId" | "updatedAt" | "history" | "comments"> & { adviseeId?: string; primaryAdvisorId?: string; secondaryAdvisorIds?: string[] };
