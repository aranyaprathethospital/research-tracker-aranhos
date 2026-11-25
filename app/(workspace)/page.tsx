import { Suspense } from "react";
import { redirect } from "next/navigation";
import ResearchWorkspace from "@/features/research/components/research-workspace";
import { workspacePaths, type WorkspaceView } from "@/features/workspace/navigation";
import Loading from "./loading";

type SearchParams = Promise<{ view?: string | string[] }>;

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<Loading />}><Overview searchParams={searchParams} /></Suspense>;
}

async function Overview({ searchParams }: { searchParams: SearchParams }) {
  const { view } = await searchParams;
  if (typeof view === "string" && view !== "ภาพรวม" && Object.hasOwn(workspacePaths, view)) {
    redirect(workspacePaths[view as WorkspaceView]);
  }
  return <ResearchWorkspace view="ภาพรวม" />;
}
