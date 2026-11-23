"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowDownRight, ArrowRight, Bell, BookOpenCheck, CalendarDays, Check, CheckCircle2,
  ChevronDown, CircleAlert, Clock3, FileText, FolderKanban, LayoutDashboard, LogOut,
  MessageCircle, Plus, Search, ShieldCheck, Users, UserRoundCog, X,
} from "lucide-react";
import { toast } from "sonner";
import { initialResearch, stages, type Research, type ReviewStatus, type Role } from "@/lib/demo-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import UserDirectory from "./user-directory";
import TeamDirectory, { type TeamMember } from "./team-directory";

type DirectoryPerson = {
  id: string; name: string; systemRole: string; capabilities: string[]; email?: string;
  position?: string; positionLevel?: string; mission?: string; workGroup?: string;
  providerId?: string | null; cidRegistered?: boolean; active?: boolean; userId?: string | null;
  avatarUrl?: string | null; signatureUrl?: string | null;
};
type ResearchChanges = Partial<Research> & { primaryAdvisorId?: string; secondaryAdvisorIds?: string[] };
type ProjectInput = Omit<Research, "id" | "updatedAt" | "history" | "comments"> & { adviseeId?: string; primaryAdvisorId?: string; secondaryAdvisorIds?: string[] };
type DashboardProps = { demo?: boolean; initialItems?: Research[]; role?: Role; availableRoles?: Role[]; systemRole?: string; personName?: string; directory?: DirectoryPerson[] };

const navigation = [
  { label: "ภาพรวม", icon: LayoutDashboard },
  { label: "งานวิจัย", icon: FolderKanban },
  { label: "ความเห็น", icon: MessageCircle },
  { label: "ทีม", icon: Users, liveOnly: true },
  { label: "จัดการผู้ใช้", icon: UserRoundCog, managerOnly: true },
];
const reviews: ReviewStatus[] = ["ยังไม่ส่งตรวจ", "ส่งตรวจ", "ขอแก้ไข", "อนุมัติ"];
const fieldClass = "h-11 rounded-xl border-[#e7e1eb] bg-white text-base focus-visible:border-[#9774b2] focus-visible:ring-[#9774b2]/20";
const textareaClass = "min-h-24 rounded-xl border-[#e7e1eb] bg-white text-base focus-visible:border-[#9774b2] focus-visible:ring-[#9774b2]/20";

const dayDiff = (date: string) => differenceInCalendarDays(parseISO(date), new Date());
const formatThaiDate = (date: string, withYear = false) => format(parseISO(date), withYear ? "d MMM yyyy" : "d MMM", { locale: th });
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") || "RT";
const reviewTone = (status: ReviewStatus) => {
  if (status === "อนุมัติ") return "border-[#dcebd1] bg-[#eff7e9] text-[#4e702f]";
  if (status === "ขอแก้ไข") return "border-[#f3d7d2] bg-[#fff2ef] text-[#a44e43]";
  if (status === "ส่งตรวจ") return "border-[#d9e5f4] bg-[#f0f5fc] text-[#4b6d9d]";
  return "border-[#e8e4ec] bg-[#f7f6f8] text-[#71697b]";
};

export default function Dashboard({ demo = true, initialItems = initialResearch, role: initialRole = "PM", availableRoles = [], systemRole = "USER", personName = "ดร. อรทัย วัฒนกุล", directory = [] }: DashboardProps) {
  const router = useRouter();
  const [items, setItems] = useState<Research[]>(initialItems);
  const [people, setPeople] = useState<DirectoryPerson[]>(directory);
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [ready, setReady] = useState(!demo);
  const [role, setRole] = useState<Role>(initialRole);
  const [person, setPerson] = useState(personName);
  const [active, setActive] = useState("ภาพรวม");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("ทั้งหมด");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isManager = role === "PM" || role === "Superadmin" || systemRole === "PM" || systemRole === "SUPERADMIN";
  const selectedItem = items.find((item) => item.id === selected) ?? null;
  const nav = navigation.filter((item) => (!item.liveOnly || !demo) && (!item.managerOnly || isManager));
  const visible = useMemo(() => items.filter((item) => isManager || (role === "Advisor" ? item.advisor.includes(person) : item.student === person)), [items, role, person, isManager]);
  const filtered = useMemo(() => visible.filter((item) => (stageFilter === "ทั้งหมด" || item.stage === Number(stageFilter)) && `${item.title} ${item.student} ${item.id} ${item.faculty} ${item.advisor.join(" ")}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [visible, query, stageFilter]);
  const deadlines = visible.filter((item) => dayDiff(item.dueDate) <= 14).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const attention = visible.filter((item) => item.issue || item.review === "ขอแก้ไข" || dayDiff(item.dueDate) < 0);
  const stageCounts = stages.map((_, index) => visible.filter((item) => item.stage === index).length);
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: th });

  useEffect(() => {
    if (!demo) return;
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("research-tracker-demo");
      if (saved) {
        try { setItems(JSON.parse(saved) as Research[]); }
        catch { localStorage.removeItem("research-tracker-demo"); }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [demo]);

  useEffect(() => {
    if (demo && ready) localStorage.setItem("research-tracker-demo", JSON.stringify(items));
  }, [items, ready, demo]);

  useEffect(() => {
    if (demo || active !== "ทีม" || team !== null) return;
    let cancelled = false;
    void fetch("/api/team", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "โหลดรายชื่อทีมไม่สำเร็จ");
        if (!cancelled) setTeam(result.people as TeamMember[]);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setTeam([]);
          toast.error(error instanceof Error ? error.message : "โหลดรายชื่อทีมไม่สำเร็จ");
        }
      });
    return () => { cancelled = true; };
  }, [demo, active, team]);

  const updateProject = (id: string, updates: ResearchChanges, description: string, actor = isManager ? (role === "Superadmin" ? "Superadmin" : "ผู้จัดการโครงการ") : person) => {
    const date = new Date().toISOString();
    if (!demo) {
      const { comments, advisor, primaryAdvisor, secondaryAdvisors, primaryAdvisorId, secondaryAdvisorIds, ...fields } = updates;
      const comment = comments?.[0]?.text;
      void fetch("/api/projects", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields, ...(primaryAdvisorId ? { primaryAdvisorId } : {}), ...(secondaryAdvisorIds ? { secondaryAdvisorIds } : {}), ...(comment ? { comment } : {}) }),
      }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "บันทึกไม่สำเร็จ");
        if (result.project) setItems((current) => current.map((item) => item.id === id ? result.project as Research : item));
        else setItems((current) => current.map((item) => item.id === id ? { ...item, ...fields, ...(comment ? { comments: [{ text: comment, date, by: person }, ...item.comments] } : {}), updatedAt: date, history: [{ text: description, date, by: person }, ...item.history] } : item));
        toast.success("บันทึกการเปลี่ยนแปลงแล้ว");
      }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง"));
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates, updatedAt: date, history: [{ text: description, date, by: actor }, ...item.history] } : item));
    toast.success("บันทึกการเปลี่ยนแปลงแล้ว");
  };

  const createProject = (project: ProjectInput) => {
    if (!demo) {
      void fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: project.title, adviseeId: project.adviseeId, primaryAdvisorId: project.primaryAdvisorId, secondaryAdvisorIds: project.secondaryAdvisorIds, faculty: project.faculty, dueDate: project.dueDate }),
      }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "สร้างรายการไม่สำเร็จ");
        setItems((current) => [result.project as Research, ...current]);
        setCreating(false);
        setActive("งานวิจัย");
        toast.success("เพิ่มงานวิจัยแล้ว");
      }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "สร้างรายการไม่สำเร็จ ตรวจสอบข้อมูลและสิทธิ์ PM"));
      return;
    }
    const createdAt = new Date().toISOString();
    const next: Research = { ...project, id: `R-${String(Date.now()).slice(-5)}`, updatedAt: createdAt, history: [{ text: "สร้างรายการงานวิจัย", date: createdAt, by: "ผู้จัดการโครงการ" }], comments: [] };
    setItems((current) => [next, ...current]);
    setCreating(false);
    setActive("งานวิจัย");
    toast.success("เพิ่มงานวิจัยแล้ว");
  };

  const changeActive = (value: string) => {
    setActive(value);
    setMobileMenuOpen(false);
    if (value !== "งานวิจัย") setStageFilter("ทั้งหมด");
  };

  const signOut = async () => {
    const { authClient } = await import("@/lib/auth-client");
    await authClient.signOut();
    router.replace("/login");
  };

  if (!ready) return <main className="grid min-h-[100svh] place-items-center bg-[#f6f7fb] px-5 text-base text-[#71697b]">กำลังเตรียมพื้นที่ทำงาน…</main>;

  return (
    <div className="min-h-[100svh] bg-[#f6f7fb] text-[#30283a]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-[#e9e5ed] bg-white px-4 py-5 lg:flex">
        <a href="#top" className="mb-8 flex h-12 items-center rounded-xl px-2" aria-label="Research Tracker หน้าแรก">
          <Image src="/images/branding/logo-horizontal.png.png" alt="Research Tracker" width={434} height={145} priority className="h-auto w-[198px] object-contain" />
        </a>
        <div className="mb-3 px-3 text-xs font-bold tracking-[.16em] text-[#9a92a2]">WORKSPACE</div>
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#eeeaf2] bg-[#fbfafc] p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eee8f4] text-base font-bold text-[#694786]">ส</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">สถาบันวิจัยสุขภาพ</span><span className="mt-0.5 block truncate text-sm text-[#8a8292]">ภาควิชาสาธารณสุข</span></span>
          <ChevronDown className="size-4 text-[#9a92a2]" />
        </div>
        <p className="mb-2 px-3 text-sm font-semibold text-[#938b9a]">เมนูหลัก</p>
        <nav aria-label="เมนูหลัก" className="space-y-1">
          {nav.map(({ label, icon: Icon }) => <NavButton key={label} label={label} icon={Icon} active={active === label} count={label === "ความเห็น" ? visible.reduce((count, item) => count + item.comments.length, 0) : undefined} onClick={() => changeActive(label)} />)}
        </nav>
        <Separator className="my-5 bg-[#eeeaf2]" />
        <p className="mb-2 px-3 text-sm font-semibold text-[#938b9a]">เครื่องมือ</p>
        <NavButton label="ปฏิทินกำหนดส่ง" icon={CalendarDays} active={false} onClick={() => changeActive("งานวิจัย")} />
        <div className="mt-auto rounded-2xl border border-[#e6e0eb] bg-gradient-to-br from-[#f7f2fa] to-[#f1f7eb] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#554465]"><ShieldCheck className="size-4 text-[#76519a]" />{demo ? "โหมดตัวอย่าง" : "เชื่อมต่อฐานข้อมูล"}</div>
          <p className="mt-2 text-sm leading-6 text-[#776f80]">{demo ? "ข้อมูลตัวอย่างบันทึกไว้ในเบราว์เซอร์นี้" : "ข้อมูลและสิทธิ์แสดงตามบทบาทของคุณ"}</p>
          {demo && <a href="/README.md" className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-[#674382]">วิธีตั้งค่า ProviderID <ArrowRight className="ml-1 size-4" /></a>}
        </div>
        <button onClick={() => { if (!demo) router.push("/profile"); }} className="mt-4 flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left transition hover:bg-[#f7f5f9]">
          <Avatar className="size-10 rounded-xl"><AvatarFallback className="rounded-xl bg-[#eee8f4] font-semibold text-[#674382]">{initials(person)}</AvatarFallback></Avatar>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{person}</span><span className="block truncate text-sm text-[#837a8b]">{roleLabel(role)}</span></span>
          <ChevronDown className="size-4 text-[#958c9c]" />
        </button>
      </aside>

      <div className="sticky top-0 z-30 border-b border-[#e9e5ed] bg-white/95 px-4 backdrop-blur sm:px-6 lg:ml-[264px] lg:px-8">
        <header className="mx-auto flex min-h-16 max-w-[1540px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button className="grid size-10 shrink-0 place-items-center rounded-xl text-[#6f6579] hover:bg-[#f5f2f7] lg:hidden" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="เปิดเมนู"><Users className="size-5" /></button>
            <Image src="/images/branding/logo-horizontal.png.png" alt="Research Tracker" width={434} height={145} priority className="h-auto w-[150px] object-contain sm:w-[172px] lg:hidden" />
            <div className="hidden min-w-0 items-center gap-2 text-sm text-[#8a8292] lg:flex"><span>งานวิจัย</span><span>/</span><span className="truncate font-semibold text-[#483d52]">{active}</span></div>
            <span className="hidden rounded-full border border-[#e5e2e9] bg-[#faf9fb] px-2.5 py-1 text-xs font-semibold text-[#746b7e] sm:inline-flex">{demo ? "DEMO MODE" : "LIVE SESSION"}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {demo && <label className="flex items-center gap-2 text-sm text-[#807787]"><span className="hidden sm:inline">มุมมอง</span><select value={role} aria-label="เลือกบทบาท" onChange={(event) => { const next = event.target.value as Role; setRole(next); setPerson(next === "Advisor" ? "ดร. อรทัย วัฒนกุล" : "กมลชนก ใจดี"); }} className="h-10 rounded-xl border border-[#e7e1eb] bg-white px-2.5 text-sm font-semibold text-[#4d4258] outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15">{["PM", "Advisor", "Advisee"].map((value) => <option key={value}>{value}</option>)}</select></label>}
            {!demo && availableRoles.length > 1 && availableRoles.includes(role) && <label className="flex items-center gap-2 text-sm text-[#807787]"><span className="hidden sm:inline">โหมด</span><select value={role} aria-label="เลือกโหมดทำงาน" onChange={async (event) => { const next = event.target.value as Role; const response = await fetch("/api/profile/mode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: next === "Advisor" ? "ADVISOR" : "ADVISEE" }) }); const result = await response.json(); if (response.ok) router.refresh(); else toast.error(result.error ?? "เปลี่ยนโหมดไม่สำเร็จ"); }} className="h-10 rounded-xl border border-[#e7e1eb] bg-white px-2.5 text-sm font-semibold text-[#4d4258] outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15">{availableRoles.map((value) => <option key={value}>{value}</option>)}</select></label>}
            <Button variant="outline" size="icon" aria-label="การแจ้งเตือน" className="relative size-10 rounded-xl border-[#e8e4ec] text-[#716879]"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#7da245]" /></Button>
            {!demo && <Button variant="ghost" size="icon" aria-label="ออกจากระบบ" onClick={() => void signOut()} className="size-10 rounded-xl text-[#716879]"><LogOut className="size-4" /></Button>}
          </div>
        </header>
        {mobileMenuOpen && <nav aria-label="เมนูหลัก" className="mx-auto grid max-w-[1540px] grid-cols-2 gap-2 pb-4 sm:grid-cols-3 lg:hidden">{nav.map(({ label, icon: Icon }) => <NavButton key={label} label={label} icon={Icon} active={active === label} onClick={() => changeActive(label)} compact />)}</nav>}
      </div>

      <main className="px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:ml-[264px] lg:px-8 lg:pb-10 lg:pt-8" id="top">
        <div className="mx-auto max-w-[1540px]">
          <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-[#e8e3ed] bg-white px-5 py-6 shadow-[0_8px_30px_rgba(48,36,60,.035)] sm:px-8 sm:py-8 lg:px-10">
            <div className="relative z-10 max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f5f1f8] px-3 py-1.5 text-sm font-semibold text-[#6d4a8c]"><span className="size-2 rounded-full bg-[#81a949]" />{todayLabel}</div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#342740] sm:text-3xl lg:text-4xl">{heading(active)}</h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-[#777080]">{description(active, isManager, role)}</p>
              {isManager && <Button onClick={() => setCreating(true)} className="mt-5 h-11 rounded-xl px-4"><Plus className="size-4" />เพิ่มงานวิจัย</Button>}
            </div>
            <Image src="/images/branding/illustration-research.png.png" alt="" width={362} height={272} priority className="pointer-events-none absolute -right-7 -bottom-12 hidden h-72 w-80 object-contain opacity-80 lg:block xl:right-8 xl:bottom-[-4.5rem] xl:h-[340px] xl:w-[400px]" />
          </section>

          {active !== "จัดการผู้ใช้" && active !== "ทีม" && <>
            <section aria-label="สรุปงานวิจัย" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <MetricCard title="งานวิจัยทั้งหมด" value={visible.length} detail="รายการที่อยู่ในระบบ" icon={BookOpenCheck} tone="violet" />
              <MetricCard title="กำลังดำเนินการ" value={visible.filter((item) => item.stage > 0 && item.stage < 7).length} detail="อยู่ระหว่างทำวิจัย" icon={Clock3} tone="blue" />
              <MetricCard title="ใกล้ถึงกำหนดส่ง" value={deadlines.filter((item) => dayDiff(item.dueDate) >= 0).length} detail="ภายใน 14 วัน" icon={CalendarDays} tone="green" />
              <MetricCard title="ต้องติดตาม" value={attention.length} detail="มีเรื่องรอการดูแล" icon={CircleAlert} tone="rose" />
            </section>

            {isManager && <Card className="mb-6 rounded-[1.75rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025]">
              <CardHeader className="flex flex-row items-center justify-between gap-4 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
                <div><CardTitle className="text-lg font-semibold text-[#3a2e45]">ความก้าวหน้าตามขั้นตอน</CardTitle><p className="mt-1 text-sm text-[#817888]">ภาพรวมจำนวนโครงการในแต่ละช่วงการวิจัย</p></div>
                <Button variant="ghost" onClick={() => changeActive("งานวิจัย")} className="hidden min-h-10 rounded-xl text-[#694786] sm:inline-flex">ดูรายการ <ArrowRight className="size-4" /></Button>
              </CardHeader>
              <CardContent className="grid gap-2 px-5 pb-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                {stages.map((stage, index) => <button key={stage} onClick={() => { setActive("งานวิจัย"); setStageFilter(String(index)); }} className="flex min-h-14 items-center gap-3 rounded-xl border border-[#f0edf3] bg-[#fdfcfe] px-3 text-left transition hover:border-[#d9cde3] hover:bg-[#faf7fc]">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f1ebf6] text-sm font-bold text-[#704b8d]">{String(index).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate text-sm font-medium text-[#5c5266]">{stage}</span><span className="text-sm font-semibold text-[#483d52]">{stageCounts[index]}</span>
                </button>)}
              </CardContent>
            </Card>}
          </>}

          {(active === "ทีม" && !demo) ? <TeamDirectory people={team ?? []} loading={team === null} /> : active === "จัดการผู้ใช้" && isManager ?
            <UserDirectory people={people} onChange={setPeople} canAssignSystemRole={role === "Superadmin" || systemRole === "SUPERADMIN"} /> :
            <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
              <ProjectList items={filtered} active={active} query={query} stageFilter={stageFilter} onQueryChange={setQuery} onStageChange={setStageFilter} onSelect={setSelected} />
              <aside className="grid gap-5 md:grid-cols-2 2xl:grid-cols-1">
                <DeadlinePanel items={showAllDeadlines ? deadlines : deadlines.slice(0, 4)} total={deadlines.length} expanded={showAllDeadlines} onToggle={() => setShowAllDeadlines((value) => !value)} onSelect={setSelected} onViewAll={() => changeActive("งานวิจัย")} />
                <AttentionPanel items={attention.slice(0, 4)} total={attention.length} onSelect={setSelected} onViewAll={() => { changeActive("งานวิจัย"); setQuery(""); }} />
                {isManager && <Card className="rounded-[1.5rem] border-[#e8e3ed] bg-gradient-to-br from-[#f8f4fb] to-[#f2f7ec] shadow-none"><CardContent className="flex items-start gap-3 p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#704b8d] shadow-sm"><Users className="size-5" /></span><div><h2 className="text-base font-semibold text-[#42364d]">บัญชีเข้าใช้งาน</h2><p className="mt-1 text-sm leading-6 text-[#756d7e]">ลงทะเบียน CID และกำหนดบทบาทก่อนเริ่มใช้งาน</p><Button variant="ghost" className="mt-2 h-10 px-0 text-[#694786]" onClick={() => changeActive("จัดการผู้ใช้")}>จัดการผู้ใช้ <ArrowRight className="size-4" /></Button></div></CardContent></Card>}
              </aside>
            </div>}
          <footer className="mt-8 hidden items-center justify-between border-t border-[#e8e4ec] pt-5 text-sm text-[#8a8292] sm:flex"><span>Research Tracker · ระบบติดตามความก้าวหน้างานวิจัย</span><span>{demo ? "ข้อมูลตัวอย่าง · บันทึกในเบราว์เซอร์" : "พื้นที่ทำงานส่วนบุคคล"}</span></footer>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#e9e5ed] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),.5rem)] pt-2 backdrop-blur lg:hidden" aria-label="เมนูด้านล่าง">
        {nav.filter((item) => item.label !== "จัดการผู้ใช้").slice(0, 4).map(({ label, icon: Icon }) => <button key={label} onClick={() => changeActive(label)} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition ${active === label ? "text-[#65418a]" : "text-[#847b8c]"}`}><Icon className="size-5" /><span>{label}</span></button>)}
      </nav>

      <ProjectDialog key={selectedItem?.id ?? "closed"} item={selectedItem} role={role} systemRole={systemRole} person={person} people={people} demo={demo} onClose={() => setSelected(null)} onSave={updateProject} />
      <CreateProjectDialog open={creating} people={people} demo={demo} onOpenChange={setCreating} onCreate={createProject} />
    </div>
  );
}

function NavButton({ label, icon: Icon, active, onClick, count, compact = false }: { label: string; icon: typeof LayoutDashboard; active: boolean; onClick: () => void; count?: number; compact?: boolean }) {
  return <button onClick={onClick} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${active ? "bg-[#f2edf7] text-[#65418a]" : "text-[#746c7c] hover:bg-[#f7f5f9] hover:text-[#4c3e59]"} ${compact ? "border border-[#eeeaf2] bg-white" : ""}`}>
    <Icon className="size-[18px] shrink-0" /><span className="min-w-0 flex-1 truncate">{label}</span>{typeof count === "number" && count > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[#6c4b87]">{count}</span>}
  </button>;
}

function MetricCard({ title, value, detail, icon: Icon, tone }: { title: string; value: number; detail: string; icon: typeof BookOpenCheck; tone: "violet" | "blue" | "green" | "rose" }) {
  const tones = { violet: "bg-[#f2edf7] text-[#704b8d]", blue: "bg-[#edf3fb] text-[#5473a1]", green: "bg-[#eef5e7] text-[#64813d]", rose: "bg-[#fff0ed] text-[#a85449]" };
  return <Card className="min-h-[144px] rounded-[1.5rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025] sm:min-h-[158px]">
    <CardContent className="p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><span className="grid size-10 place-items-center rounded-xl sm:size-11 sm:rounded-2xl"><span className={`grid size-full place-items-center rounded-[inherit] ${tones[tone]}`}><Icon className="size-5" /></span></span><ArrowDownRight className="size-4 text-[#b6aebb]" /></div><div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-[#33273f] sm:mt-4 sm:text-3xl">{String(value).padStart(2, "0")}</div><div className="mt-1 text-sm font-semibold text-[#51465c] sm:text-base">{title}</div><p className="mt-1 text-sm text-[#8b8292]">{detail}</p></CardContent>
  </Card>;
}

function ProjectList({ items, active, query, stageFilter, onQueryChange, onStageChange, onSelect }: { items: Research[]; active: string; query: string; stageFilter: string; onQueryChange: (value: string) => void; onStageChange: (value: string) => void; onSelect: (id: string) => void }) {
  const title = active === "ความเห็น" ? "ความเห็นและรายการติดตาม" : active === "งานวิจัย" ? "งานวิจัยทั้งหมด" : "งานวิจัยที่ติดตาม";
  return <Card className="min-w-0 rounded-[1.75rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025]">
    <CardHeader className="gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-lg font-semibold text-[#3a2e45]">{title}</CardTitle><p className="mt-1 text-sm text-[#817888]">{items.length} รายการที่ตรงกับมุมมองและตัวกรอง</p></div><Badge variant="outline" className="h-8 rounded-full border-[#e8e3ed] bg-[#fbfafc] px-3 text-sm font-semibold text-[#6f6678]">{items.length} รายการ</Badge></div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#968d9d]" /><Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="ค้นหาหัวข้อ นักวิจัย หรือรหัสโครงการ" aria-label="ค้นหางานวิจัย" className="h-11 rounded-xl border-[#e8e3ed] pl-10 text-base" /></label>
        <select aria-label="กรองตามขั้นตอน" value={stageFilter} onChange={(event) => onStageChange(event.target.value)} className="h-11 rounded-xl border border-[#e8e3ed] bg-white px-3 text-sm text-[#554a60] outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"><option value="ทั้งหมด">ทุกขั้นตอน</option>{stages.map((stage, index) => <option key={stage} value={index}>{index}. {stage}</option>)}</select>
      </div>
    </CardHeader>
    <CardContent className="px-0 pb-2">
      {items.length === 0 ? <div className="mx-5 mb-5 rounded-2xl border border-dashed border-[#ddd5e4] bg-[#fcfbfd] px-5 py-12 text-center sm:mx-6"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f4eff8] text-[#765196]"><Search className="size-5" /></span><h3 className="mt-4 text-base font-semibold text-[#45394f]">ไม่พบงานวิจัย</h3><p className="mt-1 text-sm text-[#817888]">ลองเปลี่ยนคำค้นหาหรือตัวกรองขั้นตอน</p></div> : <>
        <div className="space-y-3 px-4 pb-4 md:hidden">
          {items.map((item) => <ProjectCard key={item.id} item={item} onSelect={() => onSelect(item.id)} />)}
        </div>
        <div className="hidden overflow-x-auto px-4 pb-4 md:block sm:px-6">
          <div className="min-w-[760px] overflow-hidden rounded-2xl border border-[#eeeaf2]">
            <Table>
              <TableHeader><TableRow className="bg-[#faf9fb] hover:bg-[#faf9fb]"><TableHead className="h-11 pl-4 text-xs font-bold uppercase tracking-wide text-[#8b8292]">โครงการวิจัย</TableHead><TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-[#8b8292]">ขั้นตอน</TableHead><TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-[#8b8292]">ความคืบหน้า</TableHead><TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-[#8b8292]">กำหนดส่ง</TableHead><TableHead className="h-11 text-xs font-bold uppercase tracking-wide text-[#8b8292]">สถานะตรวจ</TableHead><TableHead className="h-11 pr-4" /></TableRow></TableHeader>
              <TableBody>{items.map((item) => <TableRow key={item.id} className="cursor-pointer border-[#f0edf3] hover:bg-[#fcfbfd]" onClick={() => onSelect(item.id)}>
                <TableCell className="max-w-[320px] py-3 pl-4"><div className="flex items-center gap-3"><Avatar className="size-10 rounded-xl"><AvatarFallback className="rounded-xl bg-[#f2edf7] text-sm font-semibold text-[#694786]">{initials(item.student)}</AvatarFallback></Avatar><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#42364d]">{item.title}</span><span className="mt-1 block text-sm text-[#8b8292]">{item.student} · {item.id}</span></span></div></TableCell>
                <TableCell><StageBadge stage={item.stage} /></TableCell><TableCell className="min-w-36"><Progress value={item.progress} /></TableCell><TableCell><DueDate date={item.dueDate} /></TableCell><TableCell><ReviewBadge status={item.review} /></TableCell><TableCell className="pr-4 text-right"><Button variant="ghost" size="icon" aria-label={`เปิด ${item.title}`} className="size-9 rounded-lg"><ArrowRight className="size-4" /></Button></TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </div>
        </div>
      </>}
      <div className="flex items-center justify-between border-t border-[#f0edf3] px-5 py-3 text-sm text-[#8b8292] sm:px-6"><span>แสดง {items.length} รายการ</span><span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[#83a94b]" />อัปเดตล่าสุด</span></div>
    </CardContent>
  </Card>;
}

function ProjectCard({ item, onSelect }: { item: Research; onSelect: () => void }) {
  return <button onClick={onSelect} className="w-full rounded-2xl border border-[#eeeaf2] bg-white p-4 text-left transition hover:border-[#d7cbe2] hover:shadow-md hover:shadow-[#44304f]/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15">
    <div className="flex items-start gap-3"><Avatar className="size-10 shrink-0 rounded-xl"><AvatarFallback className="rounded-xl bg-[#f2edf7] text-sm font-semibold text-[#694786]">{initials(item.student)}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-6 text-[#3f3449]">{item.title}</span><span className="mt-0.5 block text-sm text-[#8b8292]">{item.student} · {item.id}</span></span><ArrowRight className="mt-1 size-4 shrink-0 text-[#a097a6]" /></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><StageBadge stage={item.stage} /><DueDate date={item.dueDate} /></div><div className="mt-4 flex items-center justify-between gap-3"><Progress value={item.progress} /><ReviewBadge status={item.review} /></div>
  </button>;
}

function StageBadge({ stage }: { stage: number }) { return <Badge variant="outline" className="h-7 max-w-full rounded-full border-[#e8e3ed] bg-[#faf8fc] px-2.5 text-xs font-medium text-[#655a70]"><span className="mr-1.5 size-1.5 shrink-0 rounded-full bg-[#80609b]" />{stages[stage] ?? "ไม่ระบุขั้นตอน"}</Badge>; }
function ReviewBadge({ status }: { status: ReviewStatus }) { return <Badge variant="outline" className={`h-7 shrink-0 rounded-full px-2.5 text-xs font-semibold ${reviewTone(status)}`}>{status}</Badge>; }
function DueDate({ date }: { date: string }) { const diff = dayDiff(date); return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm ${diff < 0 ? "font-semibold text-[#a74d42]" : diff <= 7 ? "font-semibold text-[#996b2d]" : "text-[#746c7d]"}`}><CalendarDays className="size-3.5" />{formatThaiDate(date)}</span>; }
function Progress({ value }: { value: number }) { return <span className="flex min-w-24 flex-1 items-center gap-2"><span className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-[#efedf2]"><span className="block h-full rounded-full bg-gradient-to-r from-[#74519a] to-[#9c7cb9]" style={{ width: `${value}%` }} /></span><span className="w-9 text-right text-sm font-semibold tabular-nums text-[#62586c]">{value}%</span></span>; }

function DeadlinePanel({ items, total, expanded, onToggle, onSelect, onViewAll }: { items: Research[]; total: number; expanded: boolean; onToggle: () => void; onSelect: (id: string) => void; onViewAll: () => void }) {
  return <Card className="rounded-[1.5rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025]">
    <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-3 pt-5"><div><CardTitle className="text-base font-semibold text-[#3e3348]">กำหนดส่งใกล้ถึง</CardTitle><p className="mt-1 text-sm text-[#817888]">รายการใน 14 วันข้างหน้า</p></div><Button onClick={onToggle} variant="ghost" size="icon" aria-label={expanded ? "ย่อรายการ" : "ดูรายการทั้งหมด"} className="size-9 rounded-lg text-[#82798a]"><ChevronDown className={`size-4 transition ${expanded ? "rotate-180" : ""}`} /></Button></CardHeader>
    <CardContent className="space-y-1 px-3 pb-4">
      {items.length ? items.map((item) => { const diff = dayDiff(item.dueDate); return <button key={item.id} onClick={() => onSelect(item.id)} className="flex min-h-[68px] w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#f8f6fa]">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${diff < 0 ? "bg-[#fff0ed] text-[#a85449]" : "bg-[#f2edf7] text-[#674382]"}`}><span className="text-base font-bold leading-none">{format(parseISO(item.dueDate), "d")}</span><span className="mt-1 text-xs">{format(parseISO(item.dueDate), "MMM", { locale: th })}</span></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#4a3f55]">{item.title}</span><span className="mt-1 block truncate text-sm text-[#8b8292]">{item.student}</span></span>
        <span className={`shrink-0 text-xs font-semibold ${diff < 0 ? "text-[#a85449]" : "text-[#817888]"}`}>{diff < 0 ? `เกิน ${Math.abs(diff)} วัน` : diff === 0 ? "วันนี้" : `${diff} วัน`}</span>
      </button>; }) : <p className="rounded-xl bg-[#faf9fb] px-3 py-6 text-center text-sm text-[#817888]">ยังไม่มีกำหนดส่งใกล้ถึง</p>}
      {total > 4 && <Button variant="ghost" onClick={onViewAll} className="mt-1 h-10 w-full justify-center rounded-xl text-[#694786]">ดูงานวิจัยทั้งหมด <ArrowRight className="size-4" /></Button>}
    </CardContent>
  </Card>;
}

function AttentionPanel({ items, total, onSelect, onViewAll }: { items: Research[]; total: number; onSelect: (id: string) => void; onViewAll: () => void }) {
  return <Card className="rounded-[1.5rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025]">
    <CardHeader className="flex flex-row items-center gap-3 px-5 pb-3 pt-5"><span className="grid size-10 place-items-center rounded-xl bg-[#fff0ed] text-[#a85449]"><CircleAlert className="size-5" /></span><div><CardTitle className="text-base font-semibold text-[#3e3348]">รายการที่ต้องติดตาม</CardTitle><p className="mt-1 text-sm text-[#817888]">มีเรื่องรอการดูแล {total} รายการ</p></div></CardHeader>
    <CardContent className="space-y-1 px-3 pb-4">
      {items.length ? items.map((item) => <button key={item.id} onClick={() => onSelect(item.id)} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left transition hover:bg-[#f8f6fa]"><span className="size-2 shrink-0 rounded-full bg-[#d98a70]" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#4c4057]">{item.issue || (item.review === "ขอแก้ไข" ? "ที่ปรึกษาขอให้ปรับแก้" : "เลยกำหนดส่ง")}</span><span className="mt-0.5 block text-sm text-[#8b8292]">{item.student} · {item.id}</span></span><ArrowRight className="size-4 shrink-0 text-[#9a91a0]" /></button>) : <p className="rounded-xl bg-[#faf9fb] px-3 py-6 text-center text-sm text-[#817888]">ไม่มีรายการค้างติดตาม</p>}
      {total > 0 && <Button variant="ghost" onClick={onViewAll} className="mt-1 h-10 w-full justify-center rounded-xl text-[#694786]">ดูรายการที่ต้องติดตาม <ArrowRight className="size-4" /></Button>}
    </CardContent>
  </Card>;
}

function CreateProjectDialog({ open, people, demo, onOpenChange, onCreate }: { open: boolean; people: DirectoryPerson[]; demo: boolean; onOpenChange: (open: boolean) => void; onCreate: (project: ProjectInput) => void }) {
  const [title, setTitle] = useState("");
  const [student, setStudent] = useState("");
  const [faculty, setFaculty] = useState("");
  const [primaryAdvisor, setPrimaryAdvisor] = useState("");
  const [secondaryAdvisorIds, setSecondaryAdvisorIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const students = demo ? Array.from(new Set(initialResearch.map((item) => item.student))).map((name) => ({ id: name, name })) : people.filter((entry) => entry.capabilities.includes("ADVISEE") && entry.active !== false).map((entry) => ({ id: entry.id, name: entry.name }));
  const advisors = demo ? Array.from(new Set(initialResearch.flatMap((item) => item.advisor))).map((name) => ({ id: name, name })) : people.filter((entry) => entry.capabilities.includes("ADVISOR") && entry.active !== false).map((entry) => ({ id: entry.id, name: entry.name }));
  const primaryName = advisors.find((entry) => entry.id === primaryAdvisor)?.name ?? "";
  const secondaryNames = secondaryAdvisorIds.map((id) => advisors.find((entry) => entry.id === id)?.name ?? id);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !student || !primaryAdvisor || !dueDate) return;
    onCreate({ title: title.trim(), student: students.find((entry) => entry.id === student)?.name ?? student, faculty, advisor: [primaryName, ...secondaryNames], primaryAdvisor: primaryName, secondaryAdvisors: secondaryNames, stage: 0, progress: 0, dueDate, issue: "", nextTask: "", review: "ยังไม่ส่งตรวจ", adviseeId: demo ? undefined : student, primaryAdvisorId: demo ? undefined : primaryAdvisor, secondaryAdvisorIds: demo ? undefined : secondaryAdvisorIds });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-[1.75rem] border-[#e9e3ed] p-0 sm:max-w-2xl">
      <div className="h-1.5 bg-gradient-to-r from-[#7750a4] to-[#85aa56]" />
      <form onSubmit={submit}>
        <DialogHeader className="px-5 pt-5 sm:px-7 sm:pt-7"><DialogTitle className="text-xl font-semibold text-[#362a42] sm:text-2xl">เพิ่มงานวิจัย</DialogTitle><DialogDescription className="text-base leading-6">สร้างโครงการและกำหนดทีมที่ปรึกษา</DialogDescription></DialogHeader>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
          <Field label="หัวข้องานวิจัย" className="sm:col-span-2"><Input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="ระบุชื่อหัวข้องานวิจัย" className={fieldClass} /></Field>
          <Field label="นักวิจัย"><select required value={student} onChange={(event) => setStudent(event.target.value)} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"><option value="">เลือกนักวิจัย</option>{students.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></Field>
          <Field label="คณะ / หน่วยงาน"><Input value={faculty} onChange={(event) => setFaculty(event.target.value)} placeholder="เช่น สาธารณสุขศาสตร์" className={fieldClass} /></Field>
          <Field label="อาจารย์ที่ปรึกษาหลัก" className="sm:col-span-2"><select required value={primaryAdvisor} onChange={(event) => { setPrimaryAdvisor(event.target.value); setSecondaryAdvisorIds((current) => current.filter((id) => id !== event.target.value)); }} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"><option value="">เลือกอาจารย์หลักหนึ่งคน</option>{advisors.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></Field>
          <fieldset className="rounded-2xl border border-[#ece7f0] p-4 sm:col-span-2"><legend className="px-1 text-sm font-semibold text-[#50445b]">อาจารย์ที่ปรึกษารอง <span className="font-normal text-[#898191]">(เลือกได้หลายคน)</span></legend><div className="grid gap-2 sm:grid-cols-2">{advisors.filter((entry) => entry.id !== primaryAdvisor).map((entry) => <label key={entry.id} className="flex min-h-11 items-center gap-3 rounded-xl bg-[#faf9fb] px-3 text-sm text-[#51465b]"><Checkbox checked={secondaryAdvisorIds.includes(entry.id)} onCheckedChange={(checked) => setSecondaryAdvisorIds((current) => checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))} className="size-5 data-checked:border-[#6d4a8b] data-checked:bg-[#6d4a8b]" />{entry.name}</label>)}</div></fieldset>
          <Field label="กำหนดส่ง" className="sm:col-span-2"><Input required type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={fieldClass} /></Field>
        </div>
        <DialogFooter className="flex-col-reverse border-t border-[#eeeaf2] bg-[#fcfbfd] px-5 py-4 sm:flex-row sm:px-7"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-xl">ยกเลิก</Button><Button type="submit" disabled={!title.trim() || !student || !primaryAdvisor || !dueDate} className="h-11 rounded-xl"><Plus className="size-4" />สร้างรายการ</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

function ProjectDialog({ item, role, systemRole, person, people, demo, onClose, onSave }: { item: Research | null; role: Role; systemRole: string; person: string; people: DirectoryPerson[]; demo: boolean; onClose: () => void; onSave: (id: string, updates: ResearchChanges, description: string) => void }) {
  const [stage, setStage] = useState(item?.stage ?? 0);
  const [progress, setProgress] = useState(item?.progress ?? 0);
  const [issue, setIssue] = useState(item?.issue ?? "");
  const [nextTask, setNextTask] = useState(item?.nextTask ?? "");
  const [dueDate, setDueDate] = useState(item?.dueDate ?? "");
  const [review, setReview] = useState<ReviewStatus>(item?.myReview ?? item?.review ?? "ยังไม่ส่งตรวจ");
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState<"รายละเอียด" | "ประวัติ">("รายละเอียด");
  const isManager = role === "PM" || role === "Superadmin" || systemRole === "PM" || systemRole === "SUPERADMIN";
  const mayEdit = isManager || role !== "Advisor";
  const maySetReview = role === "Advisor" && item?.isMyAdvisor === true;
  const advisorOptions = demo ? Array.from(new Set(initialResearch.flatMap((entry) => entry.advisor))).map((name) => ({ id: name, name })) : people.filter((entry) => entry.capabilities.includes("ADVISOR") && entry.active !== false).map((entry) => ({ id: entry.id, name: entry.name }));
  const [primaryAdvisorId, setPrimaryAdvisorId] = useState(advisorOptions.find((entry) => entry.name === item?.primaryAdvisor)?.id ?? advisorOptions.find((entry) => entry.name === item?.advisor[0])?.id ?? "");
  const [secondaryAdvisorIds, setSecondaryAdvisorIds] = useState<string[]>(advisorOptions.filter((entry) => item?.secondaryAdvisors?.includes(entry.name)).map((entry) => entry.id));

  if (!item) return null;
  const save = () => {
    const changes: ResearchChanges = {};
    const descriptions: string[] = [];
    if (stage !== item.stage) { changes.stage = stage; descriptions.push("เปลี่ยนขั้นตอนงานวิจัย"); }
    if (progress !== item.progress) { changes.progress = progress; descriptions.push(`อัปเดตความคืบหน้าเป็น ${progress}%`); }
    if (issue !== item.issue) { changes.issue = issue; descriptions.push(issue ? "อัปเดตประเด็นที่ติดขัด" : "ปิดประเด็นที่ติดขัด"); }
    if (nextTask !== item.nextTask) { changes.nextTask = nextTask; descriptions.push("อัปเดตงานถัดไป"); }
    if (dueDate !== item.dueDate) { changes.dueDate = dueDate; descriptions.push("ปรับกำหนดส่ง"); }
    const currentReview = item.myReview ?? item.review;
    if (maySetReview && review !== currentReview) { changes.review = review; descriptions.push(`เปลี่ยนสถานะตรวจเป็น ${review}`); }
    const primaryName = advisorOptions.find((entry) => entry.id === primaryAdvisorId)?.name ?? "";
    const secondaryNames = secondaryAdvisorIds.map((id) => advisorOptions.find((entry) => entry.id === id)?.name ?? id);
    const oldPrimary = item.primaryAdvisor ?? item.advisor[0] ?? "";
    const oldSecondary = item.secondaryAdvisors ?? item.advisor.filter((name) => name !== oldPrimary);
    const assignmentChanged = isManager && (primaryName !== oldPrimary || [...secondaryNames].sort().join("|") !== [...oldSecondary].sort().join("|"));
    if (assignmentChanged) {
      descriptions.push("ปรับอาจารย์ที่ปรึกษาหลักและรอง");
      Object.assign(changes, { primaryAdvisor: primaryName, secondaryAdvisors: secondaryNames, advisor: [primaryName, ...secondaryNames], ...(demo ? {} : { primaryAdvisorId, secondaryAdvisorIds }) });
    }
    if (maySetReview && comment.trim()) {
      descriptions.push("เพิ่มความเห็นจากที่ปรึกษ");
      changes.comments = [{ text: comment.trim(), date: new Date().toISOString(), by: person }, ...item.comments];
    }
    if (descriptions.length) onSave(item.id, changes, descriptions.join(" · "));
    onClose();
  };

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[calc(100svh-1rem)] w-[calc(100%-1rem)] max-w-3xl overflow-hidden rounded-[1.75rem] border-[#e9e3ed] p-0 sm:max-h-[calc(100svh-2rem)]">
      <div className="h-1.5 bg-gradient-to-r from-[#7750a4] to-[#85aa56]" />
      <div className="flex max-h-[calc(100svh-1.5rem)] flex-col sm:max-h-[calc(100svh-2.5rem)]">
        <DialogHeader className="px-5 pt-5 sm:px-7 sm:pt-7"><span className="text-sm font-semibold text-[#755494]">{item.id} · งานวิจัย</span><DialogTitle className="pr-9 text-xl font-semibold leading-snug text-[#362a42] sm:text-2xl">{item.title}</DialogTitle><DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"><span>{item.student}</span><span>·</span><span>{item.faculty || "ไม่ระบุหน่วยงาน"}</span><span>·</span><ReviewBadge status={item.review} /></DialogDescription></DialogHeader>
        <div className="mt-4 flex gap-2 border-b border-[#eeeaf2] px-5 sm:px-7"><button onClick={() => setTab("รายละเอียด")} className={`min-h-11 border-b-2 px-2 text-sm font-semibold ${tab === "รายละเอียด" ? "border-[#704b8d] text-[#64417f]" : "border-transparent text-[#8a8292]"}`}>รายละเอียด</button><button onClick={() => setTab("ประวัติ")} className={`min-h-11 border-b-2 px-2 text-sm font-semibold ${tab === "ประวัติ" ? "border-[#704b8d] text-[#64417f]" : "border-transparent text-[#8a8292]"}`}>ประวัติการอัปเดต <span className="ml-1 rounded-full bg-[#f2edf7] px-2 py-0.5 text-xs">{item.history.length}</span></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {tab === "ประวัติ" ? <div className="space-y-4">{item.history.map((entry, index) => <div key={`${entry.date}-${index}`} className="flex gap-3"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#8764a3]" /><div className="min-w-0 flex-1 border-b border-[#f0edf3] pb-4"><p className="text-sm font-semibold leading-6 text-[#4b4055]">{entry.text}</p><p className="mt-1 text-sm text-[#8b8292]">{entry.by} · {formatThaiDate(entry.date.slice(0, 10), true)}</p></div></div>)}{item.history.length === 0 && <p className="rounded-xl bg-[#faf9fb] p-5 text-center text-sm text-[#817888]">ยังไม่มีประวัติการอัปเดต</p>}</div> : <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,.85fr)]">
            <div className="grid content-start gap-4 sm:grid-cols-2">
              <Field label="ขั้นตอนปัจจุบัน" className="sm:col-span-2"><select value={stage} disabled={!mayEdit} onChange={(event) => setStage(Number(event.target.value))} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none disabled:bg-[#f5f3f7]"><option value="">เลือกขั้นตอน</option>{stages.map((name, index) => <option value={index} key={name}>{index}. {name}</option>)}</select></Field>
              <Field label={`ความคืบหน้า ${progress}%`} className="sm:col-span-2"><input type="range" min="0" max="100" value={progress} disabled={!mayEdit} onChange={(event) => setProgress(Number(event.target.value))} className="mt-2 h-2 w-full cursor-pointer accent-[#704b8d] disabled:opacity-50" /><span className="mt-1 block text-sm text-[#8b8292]">เปอร์เซ็นต์ของขั้นตอนปัจจุบัน</span></Field>
              <Field label="กำหนดส่ง" className="sm:col-span-2"><Input type="date" value={dueDate} disabled={!mayEdit} onChange={(event) => setDueDate(event.target.value)} className={`${fieldClass} disabled:bg-[#f5f3f7]`} /></Field>
              {isManager && <>
                <Field label="อาจารย์ที่ปรึกษาหลัก" className="sm:col-span-2"><select value={primaryAdvisorId} onChange={(event) => { setPrimaryAdvisorId(event.target.value); setSecondaryAdvisorIds((current) => current.filter((id) => id !== event.target.value)); }} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none">{advisorOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></Field>
                <fieldset className="rounded-2xl border border-[#ece7f0] p-3 sm:col-span-2"><legend className="px-1 text-sm font-semibold text-[#50445b]">ที่ปรึกษารอง</legend><div className="grid gap-2 sm:grid-cols-2">{advisorOptions.filter((entry) => entry.id !== primaryAdvisorId).map((entry) => <label key={entry.id} className="flex min-h-10 items-center gap-3 rounded-xl bg-[#faf9fb] px-3 text-sm text-[#51465b]"><Checkbox checked={secondaryAdvisorIds.includes(entry.id)} onCheckedChange={(checked) => setSecondaryAdvisorIds((current) => checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))} className="size-5 data-checked:border-[#6d4a8b] data-checked:bg-[#6d4a8b]" />{entry.name}</label>)}</div></fieldset>
              </>}
              <Field label="ปัญหาหรือสิ่งที่ติดขัด" className="sm:col-span-2"><Textarea rows={3} value={issue} disabled={!mayEdit} onChange={(event) => setIssue(event.target.value)} placeholder="มีเรื่องใดที่ต้องการความช่วยเหลือ" className={`${textareaClass} disabled:bg-[#f5f3f7]`} /></Field>
              <Field label="งานถัดไป" className="sm:col-span-2"><Textarea rows={2} value={nextTask} disabled={!mayEdit} onChange={(event) => setNextTask(event.target.value)} placeholder="ระบุสิ่งที่จะดำเนินการต่อ" className={`${textareaClass} disabled:bg-[#f5f3f7]`} /></Field>
            </div>
            <div className="space-y-4">
              <Card className="rounded-2xl border-[#eeeaf2] bg-[#fcfbfd] shadow-none"><CardContent className="p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#51445d]"><MessageCircle className="size-4 text-[#765196]" />ผลประเมินที่ปรึกษา</div><div className="mt-3 space-y-2">{(item.advisorReviews ?? []).map((entry) => <div key={entry.id} className="flex items-center justify-between gap-2 rounded-xl bg-white p-3"><span className="min-w-0"><span className="block truncate text-sm font-medium text-[#4e4358]">{entry.advisor}</span><span className="mt-0.5 block text-sm text-[#8b8292]">{entry.assignment === "PRIMARY" ? "อาจารย์หลัก" : "อาจารย์รอง"}</span></span><ReviewBadge status={entry.status} /></div>)}{(item.advisorReviews ?? []).length === 0 && <div className="text-sm text-[#8b8292]">ยังไม่มีผลประเมิน</div>}</div></CardContent></Card>
              <Field label="สถานะการตรวจของ Advisor"><select value={review} disabled={!maySetReview} onChange={(event) => setReview(event.target.value as ReviewStatus)} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none disabled:bg-[#f5f3f7]">{reviews.map((value) => <option key={value}>{value}</option>)}</select></Field>
              <div className="rounded-2xl border border-[#eeeaf2] p-4"><h3 className="text-sm font-semibold text-[#4d4157]">ความเห็นล่าสุด</h3><div className="mt-3 space-y-3">{item.comments.map((entry, index) => <div key={`${entry.date}-${index}`} className="rounded-xl bg-[#faf9fb] p-3"><div className="flex flex-wrap items-center justify-between gap-1"><span className="text-sm font-semibold text-[#554a60]">{entry.by}</span><span className="text-xs text-[#948b9b]">{formatThaiDate(entry.date.slice(0, 10), true)}</span></div><p className="mt-2 text-sm leading-6 text-[#706779]">{entry.text}</p></div>)}{item.comments.length === 0 && <p className="text-sm text-[#8b8292]">ยังไม่มีความเห็น</p>}</div>{maySetReview && <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="เขียนความเห็นหรือข้อเสนอแนะ" className={`${textareaClass} mt-3`} />}</div>
            </div>
          </div>}
        </div>
        <DialogFooter className="flex-row border-t border-[#eeeaf2] bg-[#fcfbfd] px-5 py-3 sm:px-7"><Button variant="outline" onClick={onClose} className="h-11 rounded-xl">ปิด</Button>{tab === "รายละเอียด" && <Button onClick={save} className="h-11 rounded-xl"><Check className="size-4" />บันทึกการเปลี่ยนแปลง</Button>}</DialogFooter>
      </div>
    </DialogContent>
  </Dialog>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`block min-w-0 space-y-2 text-sm font-semibold text-[#51465b] ${className}`}>{label}{children}</label>; }
function roleLabel(role: Role) { return role === "Superadmin" ? "Superadmin" : role === "PM" ? "ผู้จัดการโครงการ" : role === "Advisor" ? "ที่ปรึกษางานวิจัย" : "นักวิจัย"; }
function heading(active: string) { return active === "ภาพรวม" ? "ภาพรวมงานวิจัย" : active === "งานวิจัย" ? "งานวิจัยทั้งหมด" : active === "ความเห็น" ? "ความเห็นจากที่ปรึกษา" : active === "ทีม" ? "รายชื่อทีมวิจัย" : "จัดการผู้ใช้และสิทธิ์"; }
function description(active: string, isManager: boolean, role: Role) { return active === "ทีม" ? "ดูชื่อ บทบาท และข้อมูลโปรไฟล์ของสมาชิกในทีม" : active === "จัดการผู้ใช้" ? "จัดการ CID บทบาท และข้อมูลที่จำเป็นสำหรับการเข้าใช้งาน" : isManager ? "ติดตามความก้าวหน้า กำหนดส่ง และประเด็นที่ต้องดูแลในพื้นที่เดียว" : role === "Advisor" ? "งานวิจัยที่มอบหมายและความเห็นที่รอการติดตาม" : "ความคืบหน้าและรายการที่ต้องทำของคุณ"; }
