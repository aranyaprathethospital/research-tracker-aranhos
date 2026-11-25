import { Suspense } from "react";
import ResearchWorkspace from "@/features/research/components/research-workspace";
import Loading from "./loading";
import { stages } from "@/lib/research-types";
import { projectFilterLabels, type ProjectFilter } from "@/features/research/project-filter";

type SearchParams = Promise<{ stage?: string | string[]; filter?: string | string[]; project?: string | string[]; focus?: string | string[] }>;

export default function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<Loading />}><ProjectsContent searchParams={searchParams} /></Suspense>;
}

async function ProjectsContent({ searchParams }: { searchParams: SearchParams }) {
  const { stage, filter, project, focus } = await searchParams;
  const validStage = typeof stage === "string" && stages.some((_, index) => String(index) === stage);
  const validFilter = typeof filter === "string" && Object.hasOwn(projectFilterLabels, filter) ? filter as ProjectFilter : undefined;
  return <ResearchWorkspace view="งานวิจัย" stage={validStage ? stage : undefined} filter={validFilter}
    projectId={typeof project === "string" ? project : undefined} focusReview={focus === "review"} />;
}
