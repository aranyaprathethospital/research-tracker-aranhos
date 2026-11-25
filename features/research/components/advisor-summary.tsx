"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getCoreRowModel, getPaginationRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { ArrowUpRight, ChevronRight, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/ui/table-pagination";
import PageHeading from "@/features/workspace/components/page-heading";
import { stages } from "@/lib/research-types";
import { DueDate, Progress, StageBadge } from "./project-display";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type AdvisorWorkload = {
  id: string;
  name: string;
  projects: { id: string; title: string; advisee: string; stage: number; progress: number; dueDate: string | null }[];
};

const columns: LegacyColumnDef<AdvisorWorkload>[] = [
  { accessorKey: "name", header: "ที่ปรึกษาหลัก" },
  { id: "projectCount", header: "งานที่ดูแล" },
  { id: "presented", header: "ถึงขั้นนำเสนอ" },
  { id: "progress", header: "ความคืบหน้าเฉลี่ย" },
];

function averageProgress(projects: AdvisorWorkload["projects"]) {
  return projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0;
}

export default function AdvisorSummary({ advisors }: { advisors: AdvisorWorkload[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const projects = advisors.flatMap((advisor) => advisor.projects);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return advisors.filter((advisor) => advisor.name.toLocaleLowerCase().includes(search));
  }, [advisors, query]);
  const table = useLegacyTable({
    data: filtered,
    columns,
    getRowId: (advisor) => advisor.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: TABLE_PAGE_SIZE } },
  });
  const visible = table.getRowModel().rows;
  const selected = visible.find((row) => row.id === selectedId)?.original;
  const metrics = [
    { label: "ที่ปรึกษาหลักที่มีงาน", value: advisors.length },
    { label: "โครงการที่มีที่ปรึกษาหลัก", value: projects.length },
    { label: "ถึงขั้นนำเสนอ", value: projects.filter((project) => project.stage === stages.length - 1).length },
    { label: "ความคืบหน้าเฉลี่ย", value: `${averageProgress(projects)}%` },
  ];

  return (
    <>
      <PageHeading eyebrow="จัดการระบบ" title="สรุปที่ปรึกษาหลัก" description="ดูจำนวนโครงการและความคืบหน้าของที่ปรึกษาหลักแต่ละคน" />
      <dl className="mb-5 grid grid-cols-2 overflow-hidden rounded-xl border border-[#e7e0d9] bg-[#fffcf8] divide-[#e7e0d9] xl:grid-cols-4 xl:divide-x">
        {metrics.map(({ label, value }) => (
          <div key={label} className="border-[#e7e0d9] p-4 first:border-r second:border-b nth-3:border-r nth-3:border-t sm:p-5 xl:border-0">
            <dt className="text-base font-bold text-muted-foreground">{label}</dt>
            <dd className="mt-2 text-4xl font-bold leading-none tabular-nums text-primary">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="advisor-list-title" className="overflow-hidden rounded-xl border border-[#e7e0d9] bg-white">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border p-4 sm:p-5">
          <div>
            <h2 id="advisor-list-title" className="flex items-center gap-2 text-2xl font-bold"><UsersRound aria-hidden className="size-5 text-primary" /> รายชื่อที่ปรึกษาหลัก</h2>
            <p className="mt-1 text-sm text-muted-foreground">เลือกชื่อเพื่อดูขั้นตอนและกำหนดส่งของแต่ละโครงการ</p>
          </div>
          <label className="block w-full space-y-1.5 text-sm font-medium sm:w-64">
            <span>ค้นหาชื่อที่ปรึกษา</span>
            <Input value={query} onChange={(event) => {
              setQuery(event.target.value);
              table.setPageIndex(0);
            }} />
          </label>
        </div>
        {filtered.length === 0 ? (
          <p role="status" className="p-8 text-center text-sm text-muted-foreground">{advisors.length ? "ไม่พบที่ปรึกษาที่ตรงกับคำค้น" : "ยังไม่มีโครงการที่ได้รับมอบหมายที่ปรึกษาหลัก"}</p>
        ) : (
          <>
            <div className="md:hidden">
              <ul className="divide-y divide-border">
                {visible.map(({ original: advisor }) => <li key={advisor.id} className="space-y-2 p-4">
                  <AdvisorButton advisor={advisor} onClick={() => setSelectedId(advisor.id)} />
                  <p className="text-sm text-muted-foreground">{advisor.projects.length} โครงการ · ถึงขั้นนำเสนอ {advisor.projects.filter((project) => project.stage === stages.length - 1).length}</p>
                  <Progress value={averageProgress(advisor.projects)} />
                </li>)}
              </ul>
            </div>
            <div className="hidden md:block">
              <Table aria-labelledby="advisor-list-title">
                <TableHeader><TableRow>
                  {table.getHeaderGroups()[0]?.headers.map((header) => <TableHead key={header.id} scope="col">{String(header.column.columnDef.header)}</TableHead>)}
                </TableRow></TableHeader>
                <TableBody>
                  {visible.map(({ original: advisor }) => (
                    <TableRow key={advisor.id} data-state={selectedId === advisor.id ? "selected" : undefined}>
                      <TableCell><AdvisorButton advisor={advisor} onClick={() => setSelectedId(advisor.id)} /></TableCell>
                      <TableCell className="tabular-nums">{advisor.projects.length}</TableCell>
                      <TableCell className="tabular-nums">{advisor.projects.filter((project) => project.stage === stages.length - 1).length}</TableCell>
                      <TableCell className="min-w-36"><Progress value={averageProgress(advisor.projects)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination page={table.getState().pagination.pageIndex + 1} total={filtered.length} onPageChange={(page) => {
              setSelectedId(null);
              table.setPageIndex(page - 1);
            }} />
          </>
        )}
      </section>
      {selected && (
        <Dialog open onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
          <DialogContent className="max-h-[90svh] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
            <DialogHeader className="border-b border-[#e7e0d9] bg-[#fffcf8] p-5 pr-14">
              <DialogTitle className="wrap-break-word text-3xl font-bold">โครงการของ {selected.name}</DialogTitle>
              <DialogDescription>ดูแล {selected.projects.length} โครงการในฐานะที่ปรึกษาหลัก</DialogDescription>
            </DialogHeader>
            <ul className="min-h-0 divide-y divide-[#eee8e2] overflow-y-auto overscroll-contain">
            {selected.projects.map((project) => (
              <li key={project.id} className="min-w-0 space-y-3 px-5 py-4">
                <div>
                  <h3><Link href={`/projects?project=${encodeURIComponent(project.id)}`} onNavigate={() => setSelectedId(null)} className="inline-flex items-center gap-2 rounded text-lg font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"><span className="wrap-break-word">{project.title}</span><ArrowUpRight aria-hidden className="size-4 shrink-0" /></Link></h3>
                  <p className="mt-1 text-base text-muted-foreground">{project.advisee}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StageBadge stage={project.stage} />
                  {project.dueDate ? <DueDate date={project.dueDate} /> : <span className="text-sm text-muted-foreground">ยังไม่ระบุกำหนดส่ง</span>}
                </div>
                <Progress value={project.progress} />
              </li>
            ))}
            </ul>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function AdvisorButton({ advisor, onClick }: { advisor: AdvisorWorkload; onClick: () => void }) {
  return <button type="button" aria-haspopup="dialog" onClick={onClick} className="flex min-h-10 items-center gap-2 rounded-md text-left text-lg font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
    <span className="wrap-break-word">{advisor.name}</span>
    <ChevronRight aria-hidden className="size-4 shrink-0" />
  </button>;
}
