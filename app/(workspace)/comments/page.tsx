import { Suspense } from "react";
import ResearchWorkspace from "@/features/research/components/research-workspace";
import Loading from "./loading";

export default function CommentsPage() {
  return <Suspense fallback={<Loading />}><ResearchWorkspace view="ความเห็น" /></Suspense>;
}
