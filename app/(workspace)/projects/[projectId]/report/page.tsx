import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import ProjectReport from "@/features/research/components/project-report";
import { LoadingShape, Placeholder } from "@/components/ui/page-loading";
import { prisma } from "@/lib/prisma";
import { researchProjectScope } from "@/lib/research-access";
import { projectInclude, toResearchItem } from "@/lib/research-data";
import { getSignedInProfile } from "@/lib/server-access";

type ReportParams = Promise<{ projectId: string }>;

export default function ProjectReportPage({ params }: { params: ReportParams }) {
  return (
    <Suspense fallback={<LoadingShape label="กำลังเตรียมรายงาน"><Placeholder className="mx-auto mt-8 h-96 w-[min(90%,45rem)]" /></LoadingShape>}>
      <ReportContent params={params} />
    </Suspense>
  );
}

async function ReportContent({ params }: { params: ReportParams }) {
  const [{ projectId }, context] = await Promise.all([params, getSignedInProfile()]);
  if (!context) redirect("/login");
  const { profile, session, activeMode } = context;
  if (profile.mustChangePassword) redirect("/account/password");
  const credential = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { id: true },
  });
  if (!credential) redirect("/account/setup");
  if (!activeMode && (profile.systemRole === "USER" || profile.capabilities.length > 1)) redirect("/choose-role");

  const project = await prisma.researchProject.findFirst({
    where: { ...researchProjectScope(profile, activeMode), id: projectId },
    include: projectInclude(),
  });
  if (!project) notFound();
  return <ProjectReport project={toResearchItem(project)} code={project.projectCode} />;
}
