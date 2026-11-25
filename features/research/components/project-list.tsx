import { getCoreRowModel, getPaginationRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/ui/table-pagination";
import { ArrowRight, Search } from "lucide-react";
import { stages, type Research } from "@/lib/research-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initials, StageBadge, ReviewBadge, DueDate, Progress } from "./project-display";

const columns: LegacyColumnDef<Research>[] = [
  { accessorKey: "title", header: "โครงการวิจัย" },
  { accessorKey: "stage", header: "ขั้นตอน" },
  { accessorKey: "progress", header: "ความคืบหน้า" },
  { accessorKey: "dueDate", header: "กำหนดส่ง" },
  { accessorKey: "review", header: "สถานะตรวจ" },
  { id: "actions", header: "รายละเอียด" },
];

export function ProjectList({ items, active, query, stageFilter, onQueryChange, onStageChange, onSelect }: { items: Research[]; active: string; query: string; stageFilter: string; onQueryChange: (value: string) => void; onStageChange: (value: string) => void; onSelect: (id: string) => void }) {
  const table = useLegacyTable({
    data: items,
    columns,
    getRowId: (item) => item.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: TABLE_PAGE_SIZE } },
  });
  const pageItems = table.getRowModel().rows.map((row) => row.original);
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
        <div className="space-y-3 px-4 pb-4 xl:hidden">
          {pageItems.map((item) => <ProjectCard key={item.id} item={item} onSelect={() => onSelect(item.id)} />)}
        </div>
        <div className="hidden px-4 pb-4 sm:px-6 xl:block">
          <div className="overflow-hidden rounded-2xl border border-[#eeeaf2]">
            <Table aria-label={title} className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  {table.getHeaderGroups()[0]?.headers.map((header) => (
                    <TableHead key={header.id} scope="col">{String(header.column.columnDef.header)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>{pageItems.map((item) => <TableRow key={item.id}>
                <TableCell className="max-w-[320px] py-3 pl-4"><div className="flex items-center gap-3"><StudentAvatar item={item} /><span className="min-w-0"><span className="block wrap-break-word text-sm font-semibold text-[#42364d]">{item.title}</span><span className="mt-1 block text-sm text-[#8b8292]">{item.student}</span></span></div></TableCell>
                <TableCell><StageBadge stage={item.stage} /></TableCell><TableCell className="min-w-36"><Progress value={item.progress} /></TableCell><TableCell><DueDate date={item.dueDate} /></TableCell><TableCell><ReviewBadge status={item.review} /></TableCell><TableCell className="pr-4 text-right"><Button variant="ghost" size="icon" onClick={() => onSelect(item.id)} aria-label={`เปิด ${item.title}`} className="size-9 rounded-lg"><ArrowRight className="size-4" /></Button></TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </div>
        </div>
      </>}
      {items.length > 0 && <TablePagination page={table.getState().pagination.pageIndex + 1} total={items.length} onPageChange={(page) => table.setPageIndex(page - 1)} />}
    </CardContent>
  </Card>;
}

function ProjectCard({ item, onSelect }: { item: Research; onSelect: () => void }) {
  return <button onClick={onSelect} className="w-full rounded-2xl border border-[#eeeaf2] bg-white p-4 text-left transition hover:border-[#d7cbe2] hover:shadow-md hover:shadow-[#44304f]/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15">
    <div className="flex items-start gap-3"><StudentAvatar item={item} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-6 text-[#3f3449]">{item.title}</span><span className="mt-0.5 block text-sm text-[#8b8292]">{item.student} · {item.id}</span></span><ArrowRight className="mt-1 size-4 shrink-0 text-[#a097a6]" /></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><StageBadge stage={item.stage} /><DueDate date={item.dueDate} /></div><div className="mt-4 flex items-center justify-between gap-3"><Progress value={item.progress} /><ReviewBadge status={item.review} /></div>
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
