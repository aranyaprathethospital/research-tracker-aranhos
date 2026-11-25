"use client";

import ConnectionStatus from "@/components/status/connection-status";
import StatusPanel, { StatusLink } from "@/components/status/status-panel";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ArrowRight, BookOpenCheck, CalendarDays, CircleAlert, Clock3, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { type Research, type Role } from "@/lib/research-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TeamDirectory, { type TeamMember } from "@/features/team/components/team-directory";
import PageHeading from "@/features/workspace/components/page-heading";
import WorkspaceShell from "@/features/workspace/components/workspace-shell";
import type { ResearchPersonOption } from "@/features/users/types";
import { dayDiff } from "./project-display";
import { type ResearchChanges, type ProjectInput } from "./project-dialog-types";
import ResearchAnalytics from "./research-analytics";
import PeerProgress, { type PeerProject } from "./peer-progress";
import { ProjectList } from "./project-list";
import { MetricCard, DeadlinePanel, AttentionPanel } from "./research-overview-panels";
import { CreateProjectDialog } from "./create-project-dialog";
import { ProjectDialog } from "./project-dialog";

import { workspaceHref, type WorkspaceView } from "@/features/workspace/navigation";

type DashboardProps = { view: WorkspaceView; projectId?: string; focusReview?: boolean; alternateMode?: "ADVISOR" | "ADVISEE"; initialStage?: string; initialItems: Research[]; avatarUrl: string | null; navigationCounts?: readonly [number, number]; peerProjects?: PeerProject[]; role: Role; availableRoles: Role[]; systemRole: string; personName: string; currentProfileId: string; directory: ResearchPersonOption[] };

export default function Dashboard({ view: active, projectId, focusReview, alternateMode, initialStage, initialItems, avatarUrl, navigationCounts, peerProjects, role, availableRoles, systemRole, personName, currentProfileId, directory }: DashboardProps) {
  const router = useRouter();
  const [items, setItems] = useState<Research[]>(initialItems);
  const people = directory;
  const [teamFailed, setTeamFailed] = useState(false);
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const person = personName;
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState(initialStage ?? "ทั้งหมด");
  const [selected, setSelected] = useState<string | null>(projectId ?? null);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);

  const isManager = role === "PM" || role === "Superadmin" || systemRole === "PM" || systemRole === "SUPERADMIN";
  const selectedItem = items.find((item) => item.id === selected) ?? null;
  const visible = useMemo(() => items.filter((item) => isManager || (role === "Advisor" ? item.advisor.includes(person) : item.student === person)), [items, role, person, isManager]);
  const filtered = useMemo(() => visible.filter((item) => (stageFilter === "ทั้งหมด" || item.stage === Number(stageFilter)) && `${item.title} ${item.student} ${item.id} ${item.faculty} ${item.advisor.join(" ")}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [visible, query, stageFilter]);
  const deadlines = visible.filter((item) => dayDiff(item.dueDate) <= 14).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const attention = visible.filter((item) => item.issue || item.review === "ขอแก้ไข" || dayDiff(item.dueDate) < 0);
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: th });

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

  const updateProject = (id: string, updates: ResearchChanges, description: string) => {
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
    void workspaceFetch("/api/projects", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields, ...(primaryAdvisorId ? { primaryAdvisorId } : {}), ...(secondaryAdvisorIds ? { secondaryAdvisorIds } : {}), ...(comment ? { comment } : {}) }),
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "บันทึกไม่สำเร็จ");
      if (result.project) setItems((current) => current.map((item) => item.id === id ? result.project as Research : item));
      else setItems((current) => current.map((item) => item.id === id ? { ...item, ...fields, ...(comment ? { comments: [{ text: comment, date, by: person }, ...item.comments] } : {}), updatedAt: date, history: [{ text: description, date, by: person }, ...item.history] } : item));
      toast.success("บันทึกการเปลี่ยนแปลงแล้ว");
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง"));
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
      if (active !== "งานวิจัย") router.push("/projects");
      toast.success("เพิ่มงานวิจัยแล้ว");
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "สร้างรายการไม่สำเร็จ ตรวจสอบข้อมูลและสิทธิ์ PM"));
  };

  const changeActive = (value: string) => router.push(workspaceHref(value));

  return (
    <WorkspaceShell
      avatarUrl={avatarUrl}
      activeItem={active}
      personName={person}
      role={role}
      systemRole={systemRole}
      availableRoles={availableRoles}
      projectCount={navigationCounts?.[0] ?? visible.length}
      commentCount={navigationCounts?.[1] ?? visible.reduce((count, item) => count + item.comments.length, 0)}
      onNavigate={changeActive}
    >
      <PageHeading
        eyebrow={todayLabel}
        title={heading(active)}
        description={description(active, isManager, role)}
        action={systemRole === "PM" ? <Button onClick={() => setCreating(true)} className="h-11 rounded-lg px-4"><Plus className="size-4" />เพิ่มงานวิจัย</Button> : undefined}
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

      {active !== "ทีม" && <>
        <section aria-label="สรุปงานวิจัย" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <MetricCard title="งานวิจัยทั้งหมด" value={visible.length} detail="รายการที่อยู่ในระบบ" icon={BookOpenCheck} tone="violet" />
          <MetricCard title="กำลังดำเนินการ" value={visible.filter((item) => item.stage > 0 && item.stage < 7).length} detail="อยู่ระหว่างทำวิจัย" icon={Clock3} tone="blue" />
          <MetricCard title="ใกล้ถึงกำหนดส่ง" value={deadlines.filter((item) => dayDiff(item.dueDate) >= 0).length} detail="ภายใน 14 วัน" icon={CalendarDays} tone="green" />
          <MetricCard title="ต้องติดตาม" value={attention.length} detail="มีเรื่องรอการดูแล" icon={CircleAlert} tone="rose" />
        </section>

        {active === "ภาพรวม" && <ResearchAnalytics items={visible} onSelectStage={(stage) => {
          router.push(`/projects?stage=${stage}`);
        }} />}
      </>}

      {peerProjects && <PeerProgress projects={peerProjects} />}
      {active === "ทีม" ? (teamFailed ? <ConnectionStatus retry={() => setTeamFailed(false)} /> : <TeamDirectory people={team ?? []} loading={team === null} />) :
        <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <ProjectList items={filtered} active={active} query={query} stageFilter={stageFilter} onQueryChange={setQuery} onStageChange={setStageFilter} onSelect={setSelected} />
          <aside className="grid gap-5 md:grid-cols-2 2xl:grid-cols-1">
            <DeadlinePanel items={showAllDeadlines ? deadlines : deadlines.slice(0, 4)} total={deadlines.length} expanded={showAllDeadlines} onToggle={() => setShowAllDeadlines((value) => !value)} onSelect={setSelected} onViewAll={() => changeActive("งานวิจัย")} />
            <AttentionPanel items={attention.slice(0, 4)} total={attention.length} onSelect={setSelected} onViewAll={() => { changeActive("งานวิจัย"); setQuery(""); }} />
            {isManager && <Card className="rounded-2xl border-[#e9e7ed] bg-[#f5f2f8] shadow-none"><CardContent className="flex items-start gap-3 p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#704b8d]"><Users className="size-5" /></span><div><h2 className="text-base font-semibold text-[#42364d]">บัญชีเข้าใช้งาน</h2><p className="mt-1 text-sm leading-6 text-[#756d7e]">ลงทะเบียน CID และกำหนดบทบาทก่อนเริ่มใช้งาน</p><Button variant="ghost" className="mt-2 h-10 px-0 text-[#694786]" onClick={() => changeActive("จัดการผู้ใช้")}>จัดการผู้ใช้ <ArrowRight className="size-4" /></Button></div></CardContent></Card>}
          </aside>
        </div>}
      <footer className="mt-8 hidden items-center justify-between border-t border-[#e8e6ec] pt-5 text-sm text-[#8a8292] sm:flex"><span>Research Tracker · ระบบติดตามความก้าวหน้างานวิจัย</span><span>พื้นที่ทำงานส่วนบุคคล</span></footer>

      <ProjectDialog key={selectedItem?.id ?? "closed"} item={selectedItem} focusReview={Boolean(focusReview && selected === projectId)} role={role} systemRole={systemRole} currentProfileId={currentProfileId} onTitleUpdate={(project) => setItems((current) => current.map((entry) => entry.id === project.id ? { ...entry, title: project.title, titleVersion: project.titleVersion, titleHistory: project.titleHistory } : entry))} person={person} people={people} onClose={() => { setSelected(null); if (projectId) router.replace("/projects", { scroll: false }); }} onSave={updateProject} />
      {creating && <CreateProjectDialog open people={people} onOpenChange={setCreating} onCreate={createProject} />}
    </WorkspaceShell>
  );
}

function heading(active: string) { return active === "ภาพรวม" ? "ภาพรวมงานวิจัย" : active === "งานวิจัย" ? "งานวิจัยทั้งหมด" : active === "ความเห็น" ? "ความเห็นจากที่ปรึกษา" : active === "ทีม" ? "รายชื่อทีมวิจัย" : "จัดการผู้ใช้และสิทธิ์"; }

function description(active: string, isManager: boolean, role: Role) { return active === "ทีม" ? "ดูชื่อ บทบาท และข้อมูลโปรไฟล์ของสมาชิกในทีม" : active === "จัดการผู้ใช้" ? "จัดการ CID บทบาท และข้อมูลที่จำเป็นสำหรับการเข้าใช้งาน" : isManager ? "ติดตามความก้าวหน้า กำหนดส่ง และประเด็นที่ต้องดูแลในพื้นที่เดียว" : role === "Advisor" ? "งานวิจัยที่มอบหมายและความเห็นที่รอการติดตาม" : "ความคืบหน้าและรายการที่ต้องทำของคุณ"; }
