import { getCoreRowModel, getPaginationRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/ui/table-pagination";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { Research } from "@/lib/research-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initials, StageBadge, ReviewBadge, DueDate, Progress } from "./project-display";
import { projectFilterLabels, type ProjectFilter } from "@/features/research/project-filter";
import { StageSelect } from "./project-select";

const columns: LegacyColumnDef<Research>[] = [
  { accessorKey: "title", header: "โครงการวิจัย" },
  { accessorKey: "stage", header: "ขั้นตอน" },
  { accessorKey: "progress", header: "ความคืบหน้า" },
  { accessorKey: "dueDate", header: "กำหนดส่ง" },
  { accessorKey: "review", header: "สถานะตรวจ" },
  { id: "actions", header: "รายละเอียด" },
];

export function ProjectList({ items, total, query, stageFilter, filter, filtering, onQueryChange, onStageChange, onFilterChange, onSelect }: {
  items: Research[]; total: number; query: string; stageFilter: string; filter: ProjectFilter; filtering: boolean;
  onQueryChange: (value: string) => void; onStageChange: (value: string) => void; onFilterChange: (value: ProjectFilter) => void; onSelect: (id: string) => void;
}) {
  const table = useLegacyTable({
    data: items,
    columns,
    getRowId: (item) => item.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: TABLE_PAGE_SIZE } },
  });
  const pageItems = table.getRowModel().rows.map((row) => row.original);
  const hasFilters = Boolean(query || stageFilter !== "ทั้งหมด" || filter !== "all");
  const clearFilters = () => { onQueryChange(""); onStageChange("ทั้งหมด"); onFilterChange("all"); table.setPageIndex(0); };
  return <Card className="min-w-0">
    <CardHeader className="gap-4 px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-2xl">รายการโครงการ</CardTitle>
        <span aria-live="polite" className="text-base tabular-nums text-muted-foreground">{items.length} จาก {total} โครงการ</span>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="มุมมองโครงการ">
        {(Object.keys(projectFilterLabels) as ProjectFilter[]).map((choice) => (
          <Button key={choice} type="button" variant={choice === filter ? "secondary" : "ghost"} aria-pressed={choice === filter} onClick={() => { onFilterChange(choice); table.setPageIndex(0); }}>{projectFilterLabels[choice]}</Button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => { onQueryChange(event.target.value); table.setPageIndex(0); }} placeholder="ค้นหาชื่อเรื่อง ผู้วิจัย หรือที่ปรึกษา" aria-label="ค้นหางานวิจัย" className="h-11 border-[#e4dcd7] pl-10 text-base" />
        </div>
        <StageSelect value={stageFilter} filter onChange={(value) => { onStageChange(value); table.setPageIndex(0); }} />
      </div>
      {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="w-fit px-0"><X aria-hidden />ล้างตัวกรอง</Button>}
    </CardHeader>
    <CardContent aria-busy={filtering} className="px-0">
      {items.length === 0 ? <div className="border-t border-[#e7e0d9] px-5 py-12 text-center"><Search aria-hidden className="mx-auto size-7 text-primary" /><h3 className="mt-3 text-xl font-bold">{hasFilters ? "ไม่พบงานวิจัยที่ตรงกัน" : "ยังไม่มีงานวิจัย"}</h3>{hasFilters && <p className="mt-1 text-base text-muted-foreground">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>}</div> : <>
        <div className="space-y-3 border-t border-[#e7e0d9] px-4 py-4 xl:hidden">
          {pageItems.map((item) => <ProjectCard key={item.id} item={item} onSelect={() => onSelect(item.id)} />)}
        </div>
        <div className="hidden border-t border-[#e7e0d9] xl:block">
            <Table aria-label="รายการโครงการ" className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  {table.getHeaderGroups()[0]?.headers.map((header) => (
                    <TableHead key={header.id} scope="col" className={header.column.id === "actions" ? "text-right" : undefined}>{String(header.column.columnDef.header)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>{pageItems.map((item) => <TableRow key={item.id}>
                <TableCell className="w-[34%] max-w-[320px] py-3.5 pl-4 sm:pl-6"><div className="flex items-center gap-3"><StudentAvatar item={item} /><span className="min-w-0"><button type="button" onClick={() => onSelect(item.id)} className="block rounded wrap-break-word text-left text-lg font-bold leading-tight text-[#3d2b44] hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">{item.title}</button><span className="mt-0.5 block wrap-break-word text-base text-muted-foreground">{item.student}</span></span></div></TableCell>
                <TableCell><StageBadge stage={item.stage} /></TableCell><TableCell className="min-w-32"><Progress value={item.progress} /></TableCell><TableCell><DueDate date={item.dueDate} /></TableCell><TableCell><ReviewBadge status={item.review} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => onSelect(item.id)} aria-label={`เปิด ${item.title}`} className="size-9"><ArrowUpRight /></Button></TableCell>
              </TableRow>)}</TableBody>
            </Table>
        </div>
      </>}
      {items.length > 0 && <TablePagination page={table.getState().pagination.pageIndex + 1} total={items.length} onPageChange={(page) => table.setPageIndex(page - 1)} />}
    </CardContent>
  </Card>;
}

function ProjectCard({ item, onSelect }: { item: Research; onSelect: () => void }) {
  return <button onClick={onSelect} className="w-full rounded-2xl border border-[#eeeaf2] bg-white p-4 text-left transition hover:border-[#d7cbe2] hover:shadow-md hover:shadow-[#44304f]/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15">
    <div className="flex items-start gap-3"><StudentAvatar item={item} /><span className="min-w-0 flex-1"><span className="block wrap-break-word text-xl font-bold leading-tight text-[#3f3449]">{item.title}</span><span className="mt-0.5 block text-base text-muted-foreground">{item.student}</span></span><ArrowUpRight aria-hidden className="mt-1 size-4 shrink-0 text-primary" /></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><StageBadge stage={item.stage} /><DueDate date={item.dueDate} /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><Progress value={item.progress} /><ReviewBadge status={item.review} /></div>
  </button>;
}

function StudentAvatar({ item }: { item: Research }) {
  return (
    <Avatar aria-hidden className="size-10">
      <AvatarImage src={item.studentAvatarUrl ?? undefined} alt="" />
      <AvatarFallback className="bg-[#f2edf7] font-semibold text-[#694786]">
        {initials(item.student)}
      </AvatarFallback>
    </Avatar>
  );
}
