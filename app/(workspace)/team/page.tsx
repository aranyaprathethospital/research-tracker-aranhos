import { Suspense } from "react";
import ResearchWorkspace from "@/features/research/components/research-workspace";
import Loading from "./loading";

export default function TeamPage() {
  return <Suspense fallback={<Loading />}><ResearchWorkspace view="ทีม" /></Suspense>;
}
