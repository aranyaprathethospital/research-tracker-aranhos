"use client";

import ConnectionStatus from "@/components/status/connection-status";
import StatusPanel, { StatusLink } from "@/components/status/status-panel";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarDays, CircleAlert, Clock3, Plus } from "lucide-react";
import { toast } from "sonner";
import { type Research, type Role } from "@/lib/research-types";
import { Button } from "@/components/ui/button";
import TeamDirectory, { type TeamMember } from "@/features/team/components/team-directory";
import PageHeading from "@/features/workspace/components/page-heading";
import WorkspaceShell from "@/features/workspace/components/workspace-shell";
import type { ResearchPersonOption } from "@/features/users/types";
import { dayDiff } from "./project-display";
import { type ResearchChanges, type ProjectInput } from "./project-dialog-types";
import PeerProgress, { type PeerProject } from "./peer-progress";
import { ProjectList } from "./project-list";
import { MetricCard, DeadlinePanel, AttentionPanel } from "./research-overview-panels";
import { CreateProjectDialog } from "./create-project-dialog";
import { ProjectDialog } from "./project-dialog";
import { ResearchComments } from "./research-comments";
import type { ProjectFilter } from "@/features/research/project-filter";
import type { WorkspaceView } from "@/features/workspace/navigation";

const ResearchAnalytics = dynamic(() => import("./research-analytics"), {
  loading: () => <div role="status" className="mb-6 rounded-xl border border-[#e7e0d9] bg-white p-5 text-base text-muted-foreground">กำลังโหลดสถิติ…</div>,
});

type DashboardProps = { view: WorkspaceView; projectId?: string; focusReview?: boolean; alternateMode?: "ADVISOR" | "ADVISEE"; initialStage?: string; initialFilter?: ProjectFilter; initialItems: Research[]; avatarUrl: string | null; projectCount?: number; peerProjects?: PeerProject[]; role: Role; availableRoles: Role[]; systemRole: string; personName: string; currentProfileId: string; directory: ResearchPersonOption[] };

export default function Dashboard({ view: active, projectId, focusReview, alternateMode, initialStage, initialFilter = "all", initialItems, avatarUrl, projectCount, peerProjects, role, availableRoles, systemRole, personName, currentProfileId, directory }: DashboardProps) {
  const router = useRouter();
  const [items, setItems] = useState<Research[]>(initialItems);
  const people = directory;
  const [teamFailed, setTeamFailed] = useState(false);
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const person = personName;
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [stageFilter, setStageFilter] = useState(initialStage ?? "ทั้งหมด");
  const [projectFilter, setProjectFilter] = useState(initialFilter);
  const [selected, setSelected] = useState<string | null>(projectId ?? null);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [creating, setCreating] = useState(false);

  const isManager = role === "PM" || role === "Superadmin" || systemRole === "PM" || systemRole === "SUPERADMIN";
  const selectedItem = items.find((item) => item.id === selected) ?? null;
  const overview = active === "ภาพรวม";
  const deadlines = useMemo(() => items.filter(isDueSoon).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [items]);
  const attention = useMemo(() => items.filter(needsAttention), [items]);
  const filtered = useMemo(() => {
    const source = projectFilter === "due" ? deadlines : projectFilter === "attention" ? attention : items;
    const search = deferredQuery.trim().toLocaleLowerCase();
    return source.filter((item) => (stageFilter === "ทั้งหมด" || item.stage === Number(stageFilter))
      && (!search || `${item.title} ${item.student} ${item.id} ${item.faculty} ${item.advisor.join(" ")}`.toLocaleLowerCase().includes(search)));
  }, [attention, deadlines, deferredQuery, items, projectFilter, stageFilter]);

  useEffect(() => {
    if (active !== "ทีม" || team !== null || teamFailed) return;
    let cancelled = false;
    void workspaceFetch("/api/team", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "โหลดรายชื่อทีมไม่สำเร็จ");
        if (!cancelled) setTeam(result.people as TeamMember[]);
      })
      .catch(() => { if (!cancelled) setTeamFailed(true); });
    return () => { cancelled = true; };
  }, [active, team, teamFailed]);

  const updateProject = async (id: string, updates: ResearchChanges, description: string) => {
    const date = new Date().toISOString();
    const fields = { ...updates };
    const comment = fields.comments?.[0]?.text;
    delete fields.comments;
    delete fields.advisor;
    delete fields.primaryAdvisor;
    delete fields.secondaryAdvisors;
    const primaryAdvisorId = fields.primaryAdvisorId;
    const secondaryAdvisorIds = fields.secondaryAdvisorIds;
    delete fields.primaryAdvisorId;
    delete fields.secondaryAdvisorIds;
    const response = await workspaceFetch("/api/projects", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields, ...(primaryAdvisorId ? { primaryAdvisorId } : {}), ...(secondaryAdvisorIds ? { secondaryAdvisorIds } : {}), ...(comment ? { comment } : {}) }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "บันทึกไม่สำเร็จ");
    if (result.project) setItems((current) => current.map((item) => item.id === id ? result.project as Research : item));
    else setItems((current) => current.map((item) => item.id === id ? { ...item, ...fields, ...(comment ? { comments: [{ text: comment, date, by: person }, ...item.comments] } : {}), updatedAt: date, history: [{ text: description, date, by: person }, ...item.history] } : item));
    toast.success("บันทึกการเปลี่ยนแปลงแล้ว");
  };

  const createProject = async (project: ProjectInput) => {
    await workspaceFetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: project.title, adviseeId: project.adviseeId, primaryAdvisorId: project.primaryAdvisorId, secondaryAdvisorIds: project.secondaryAdvisorIds, dueDate: project.dueDate }),
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "สร้างรายการไม่สำเร็จ");
      setItems((current) => [result.project as Research, ...current]);
      setCreating(false);
      if (active !== "งานวิจัย" || projectFilter !== "all" || stageFilter !== "ทั้งหมด" || query.trim()) {
        setProjectFilter("all");
        setStageFilter("ทั้งหมด");
        setQuery("");
        router.push(`/projects?project=${encodeURIComponent(result.project.id)}`);
      } else {
        setSelected(result.project.id);
      }
      toast.success("เพิ่มงานวิจัยแล้ว");
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "สร้างรายการไม่สำเร็จ ตรวจสอบข้อมูลและสิทธิ์ PM"));
  };

  return (
    <WorkspaceShell
      avatarUrl={avatarUrl}
      activeItem={active}
      personName={person}
      role={role}
      systemRole={systemRole}
      availableRoles={availableRoles}
      projectCount={projectCount ?? items.length}
    >
      <PageHeading
        eyebrow={overview ? (isManager ? "การจัดการงานวิจัย" : role === "Advisor" ? "พื้นที่ของที่ปรึกษา" : "พื้นที่ของนักวิจัย") : undefined}
        title={heading(active)}
        description={description(active, isManager, role)}
        action={systemRole === "PM" && active !== "ทีม" && active !== "ความเห็น" ? <Button size="lg" onClick={() => setCreating(true)}><Plus aria-hidden />เพิ่มงานวิจัย</Button> : undefined}
      />
      {projectId && selected === projectId && !selectedItem && (
        <StatusPanel embedded kind={alternateMode ? "mode" : "missing"}
          title={alternateMode ? "โครงการนี้อยู่ในอีกโหมดการทำงาน" : "ไม่พบโครงการที่ต้องการเปิด"}
          description={alternateMode ? "สลับโหมดเพื่อเปิดรายละเอียดโครงการนี้" : "ลิงก์อาจเปลี่ยนไป หรือรายการนี้ไม่พร้อมให้เปิดดูแล้ว"}>
            {alternateMode && <Button disabled={switchingMode} onClick={async () => {
              setSwitchingMode(true);
              try {
                const response = await workspaceFetch("/api/profile/mode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: alternateMode }) });
                if (!response.ok) throw new Error();
                router.refresh();
              } catch {
                toast.error("เปลี่ยนโหมดไม่สำเร็จ กรุณาลองอีกครั้ง");
                setSwitchingMode(false);
              }
            }}>{switchingMode ? "กำลังสลับ…" : `สลับเป็น ${alternateMode === "ADVISOR" ? "Advisor" : "Advisee"}`}</Button>}
            <StatusLink href="/projects" secondary>กลับรายการงานวิจัย</StatusLink>
        </StatusPanel>
      )}

      {overview && <>
        <section aria-label="สรุปงานวิจัย" className="mb-5 grid grid-cols-2 overflow-hidden rounded-xl border border-[#e6dfd9] bg-[#fffcf8] divide-[#e6dfd9] xl:mb-6 xl:grid-cols-4 xl:divide-x">
          <MetricCard title="งานวิจัยทั้งหมด" value={items.length} icon={BookOpenCheck} tone="violet" href="/projects" />
          <MetricCard title="กำลังดำเนินการ" value={items.filter((item) => item.progress > 0 && item.progress < 100).length} icon={Clock3} tone="blue" />
          <MetricCard title="ใกล้กำหนดส่ง" value={deadlines.length} icon={CalendarDays} tone="green" href="/projects?filter=due" />
          <MetricCard title="ต้องติดตาม" value={attention.length} icon={CircleAlert} tone="rose" href="/projects?filter=attention" />
        </section>
        <section aria-label="งานที่ต้องดูแล" className="mb-6 grid items-start gap-4 md:grid-cols-2 lg:gap-5">
          <DeadlinePanel items={deadlines.slice(0, 4)} total={deadlines.length} onSelect={setSelected} />
          <AttentionPanel items={attention.slice(0, 4)} total={attention.length} onSelect={setSelected} />
        </section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-[#ded8d1] pb-3">
          <h2 className="text-3xl font-bold leading-none">สถิติและความคืบหน้า</h2>
          <Link href="/projects" className="inline-flex min-h-9 items-center gap-2 rounded-md font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">เปิดรายการงานวิจัย <ArrowRight aria-hidden className="size-4" /></Link>
        </div>
        <ResearchAnalytics items={items} onSelectStage={(stage) => router.push(`/projects?stage=${stage}`)} />
        {peerProjects && <PeerProgress projects={peerProjects} />}
      </>}

      {active === "ทีม" && (teamFailed ? <ConnectionStatus retry={() => setTeamFailed(false)} /> : <TeamDirectory people={team ?? []} loading={team === null} />)}
      {active === "งานวิจัย" && <ProjectList items={filtered} total={items.length} query={query} stageFilter={stageFilter} filter={projectFilter} filtering={query !== deferredQuery} onQueryChange={setQuery} onStageChange={setStageFilter} onFilterChange={setProjectFilter} onSelect={setSelected} />}
      {active === "ความเห็น" && <ResearchComments items={items} onSelect={setSelected} />}

      {selectedItem && <ProjectDialog key={selectedItem.id} item={selectedItem} focusReview={active === "ความเห็น" || Boolean(focusReview && selected === projectId)} role={role} systemRole={systemRole} currentProfileId={currentProfileId} onTitleUpdate={(project) => setItems((current) => current.map((entry) => entry.id === project.id ? { ...entry, title: project.title, titleVersion: project.titleVersion, titleHistory: project.titleHistory } : entry))} person={person} people={people} onClose={() => {
        setSelected(null);
        if (projectId) {
          const params = new URLSearchParams();
          if (initialStage) params.set("stage", initialStage);
          if (initialFilter !== "all") params.set("filter", initialFilter);
          router.replace(params.size ? `/projects?${params}` : "/projects", { scroll: false });
        }
      }} onSave={updateProject} />}
      {creating && <CreateProjectDialog open people={people} onOpenChange={setCreating} onCreate={createProject} />}
    </WorkspaceShell>
  );
}

function heading(active: WorkspaceView) { return active === "ภาพรวม" ? "ภาพรวมงานวิจัย" : active === "งานวิจัย" ? "งานวิจัย" : active === "ความเห็น" ? "ความเห็นจากที่ปรึกษา" : "ทีมวิจัย"; }

function description(active: WorkspaceView, isManager: boolean, role: Role) {
  if (active === "ทีม") return "ค้นหาสมาชิกและดูบทบาทในทีม";
  if (active === "ความเห็น") return "อ่านข้อเสนอแนะล่าสุด แล้วเปิดโครงการเพื่อดูบริบทและประวัติ";
  if (active === "งานวิจัย") return isManager ? "ค้นหา จัดการ และติดตามโครงการแยกตามขั้นตอน" : role === "Advisor" ? "โครงการที่คุณดูแลในฐานะที่ปรึกษา" : "โครงการและความคืบหน้าของคุณ";
  return isManager ? "ติดตามกำหนดส่ง โครงการที่ต้องดูแล และภาพรวมของทีม" : role === "Advisor" ? "ดูงานที่ได้รับมอบหมายและรายการที่ต้องติดตาม" : "ดูกำหนดส่ง ความคืบหน้า และประเด็นที่ต้องดำเนินการ";
}

function isDueSoon(item: Research) {
  if (item.progress >= 100 || !item.dueDate) return false;
  const days = dayDiff(item.dueDate);
  return days >= 0 && days <= 14;
}

function needsAttention(item: Research) {
  return Boolean(item.issue || item.review === "ขอแก้ไข" || (item.progress < 100 && item.dueDate && dayDiff(item.dueDate) < 0));
}
