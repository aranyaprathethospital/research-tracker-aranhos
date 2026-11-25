import { Suspense } from "react";
import ResearchWorkspace from "@/features/research/components/research-workspace";
import Loading from "./loading";
import { stages } from "@/lib/research-types";

type SearchParams = Promise<{ stage?: string | string[]; project?: string | string[]; focus?: string | string[] }>;

export default function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<Loading />}><ProjectsContent searchParams={searchParams} /></Suspense>;
}

async function ProjectsContent({ searchParams }: { searchParams: SearchParams }) {
  const { stage, project, focus } = await searchParams;
  const validStage = typeof stage === "string" && stages.some((_, index) => String(index) === stage);
  return <ResearchWorkspace view="งานวิจัย" stage={validStage ? stage : undefined}
    projectId={typeof project === "string" ? project : undefined} focusReview={focus === "review"} />;
}
