import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, MessageSquareText, Search, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/ui/table-pagination";
import type { Research } from "@/lib/research-types";
import { initials, ReviewBadge, StageBadge } from "./project-display";

const timeZone = "Asia/Bangkok";
const dateLabel = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { dateStyle: "long", timeZone });
const timeLabel = new Intl.DateTimeFormat("th-TH", { timeStyle: "short", hourCycle: "h23", timeZone });
const sortOptions = [
  { value: "newest", label: "ใหม่สุดก่อน" },
  { value: "oldest", label: "เก่าสุดก่อน" },
] as const;
type SortOrder = (typeof sortOptions)[number]["value"];

export function ResearchComments({ items, onSelect }: { items: Research[]; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [order, setOrder] = useState<SortOrder>("newest");
  const [page, setPage] = useState(1);

  const projectsWithComments = useMemo(() => items.filter((item) => item.comments.length > 0), [items]);
  const projectOptions = useMemo(() => [
    { label: "ทุกโครงการ", value: "" },
    ...projectsWithComments.map(({ id, title }) => ({ label: title, value: id })),
  ], [projectsWithComments]);
  const comments = useMemo(() => projectsWithComments.flatMap((item) => item.comments.map((comment, index) => ({
    ...comment,
    project: item,
    key: `${item.id}:${comment.date}:${index}`,
  }))).sort((a, b) => b.date.localeCompare(a.date)), [projectsWithComments]);

  const search = query.trim().toLocaleLowerCase("th");
  const hasFilters = Boolean(search || projectFilter);
  const filtered = useMemo(() => {
    const results = comments.filter(({ project, by, text }) =>
      (!projectFilter || project.id === projectFilter) &&
      (!search || `${project.title} ${project.student} ${by} ${text}`.toLocaleLowerCase("th").includes(search)),
    );
    return order === "oldest" ? results.reverse() : results;
  }, [comments, order, projectFilter, search]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE)));
  const offset = (currentPage - 1) * TABLE_PAGE_SIZE;
  const groups = new Map<string, typeof filtered>();
  for (const entry of filtered.slice(offset, offset + TABLE_PAGE_SIZE)) {
    const day = dateLabel.format(new Date(entry.date));
    const entries = groups.get(day);
    if (entries) entries.push(entry);
    else groups.set(day, [entry]);
  }

  function clearFilters() {
    setQuery("");
    setProjectFilter("");
    setPage(1);
  }

  return (
    <Card className="mx-auto w-full max-w-5xl">
      <section aria-labelledby="research-comments-title">
        <div className="border-b border-[#e7e0d9] bg-[#fffcf8] p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><MessageSquareText aria-hidden className="size-5" /></span>
            <div>
              <h2 id="research-comments-title" className="text-2xl font-bold leading-tight">รายการความเห็น</h2>
              <p className="text-base text-muted-foreground">{comments.length} ความเห็นจาก {projectsWithComments.length} โครงการ</p>
            </div>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem]">
            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <label htmlFor="research-comment-search" className="mb-1 block font-bold">ค้นหาความเห็น</label>
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="research-comment-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ชื่อโครงการ ผู้เขียน หรือข้อความ" className="pl-10 text-base" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="mb-1 font-bold">โครงการ</p>
              <SelectField label="กรองตามโครงการ" value={projectFilter} options={projectOptions} onChange={(value) => { setProjectFilter(value); setPage(1); }} />
            </div>
            <div className="min-w-0">
              <p className="mb-1 font-bold">เรียงตามเวลา</p>
              <SelectField label="เรียงตามเวลา" value={order} options={sortOptions} onChange={(value) => { setOrder(value); setPage(1); }} />
            </div>
          </div>
          {hasFilters && <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p aria-live="polite" className="text-base text-muted-foreground">พบ {filtered.length} ความเห็น</p>
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}><X aria-hidden />ล้างตัวกรอง</Button>
          </div>}
        </div>
        {filtered.length > 0 ? (
          <>
            {Array.from(groups, ([day, entries]) => (
              <div key={day}>
                <h3 className="flex items-center gap-2 border-y border-[#eee8e2] bg-[#f8f4ef] px-4 py-2.5 text-base font-bold text-[#5f4c64] first:border-t-0 sm:px-6">
                  <CalendarDays aria-hidden className="size-4" />{day}
                </h3>
                <ol className="divide-y divide-[#eee8e2]">
                  {entries.map(({ key, project, by, text, date }) => (
                    <li key={key} className="flex gap-3 px-4 py-5 sm:gap-4 sm:px-6">
                      <Avatar aria-hidden className="size-9 shrink-0">
                        <AvatarFallback className="bg-[#efe7f3] text-base font-bold text-primary">{initials(by)}</AvatarFallback>
                      </Avatar>
                      <article className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-1">
                          <h4 className="wrap-break-word text-lg font-bold leading-tight">{by}</h4>
                          <time className="text-sm tabular-nums text-muted-foreground" dateTime={date}>{timeLabel.format(new Date(date))} น.</time>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap wrap-break-word rounded-lg bg-[#faf7fb] px-3 py-2.5 text-lg leading-snug text-[#514653]">{text}</p>
                        <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                          <div className="min-w-0">
                            <p className="wrap-break-word font-bold leading-snug">{project.title}</p>
                            <p className="mt-1 wrap-break-word text-sm text-muted-foreground">ผู้วิจัย {project.student}</p>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => onSelect(project.id)}>เปิดโครงการ <ArrowUpRight aria-hidden /></Button>
                        </div>
                        <div role="group" className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="สถานะโครงการปัจจุบัน">
                          <StageBadge stage={project.stage} /><ReviewBadge status={project.review} />
                        </div>
                      </article>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            <TablePagination page={currentPage} total={filtered.length} onPageChange={setPage} />
          </>
        ) : (
          <div className="grid justify-items-center gap-2 px-5 py-12 text-center">
            <MessageSquareText aria-hidden className="size-7 text-primary" />
            <h3 className="text-xl font-bold">{hasFilters ? "ไม่พบความเห็นที่ตรงกับตัวกรอง" : "ยังไม่มีความเห็น"}</h3>
            {!hasFilters && <p className="text-base text-muted-foreground">เมื่อที่ปรึกษาเพิ่มความเห็น รายการจะแสดงที่นี่</p>}
          </div>
        )}
      </section>
    </Card>
  );
}
