import { useMemo, useState } from "react";
import { ArrowUpRight, MessageSquareText, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/ui/table-pagination";
import type { Research } from "@/lib/research-types";
import { formatCommentDate, initials } from "./project-display";

export function ResearchComments({ items, onSelect }: { items: Research[]; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const comments = useMemo(() => items.flatMap((item) => item.comments.map((comment, index) => ({
    ...comment, projectId: item.id, title: item.title, key: `${item.id}:${comment.date}:${index}`,
  }))).sort((a, b) => b.date.localeCompare(a.date)), [items]);
  const search = query.trim().toLocaleLowerCase();
  const filtered = search ? comments.filter(({ title, by, text }) => `${title} ${by} ${text}`.toLocaleLowerCase().includes(search)) : comments;
  const offset = (page - 1) * TABLE_PAGE_SIZE;

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e7e0d9] p-4 sm:p-6">
        <div>
          <h2 className="text-2xl font-bold leading-none">ความเห็นล่าสุด</h2>
          <p className="mt-1 text-base text-muted-foreground">{filtered.length} ความเห็น</p>
        </div>
        <div className="relative w-full sm:max-w-72">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} aria-label="ค้นหาความเห็น" placeholder="ค้นหาความเห็น ชื่อโครงการ หรือผู้เขียน" className="pl-10 text-base" />
        </div>
      </div>
      {filtered.length > 0 ? (
        <>
          <ol className="divide-y divide-[#eee8e2]">
            {filtered.slice(offset, offset + TABLE_PAGE_SIZE).map((entry) => (
              <li key={entry.key} className="flex gap-3 px-4 py-5 sm:gap-4 sm:px-6">
                <Avatar aria-hidden className="size-9 shrink-0">
                  <AvatarFallback className="bg-[#efe7f3] text-base font-bold text-primary">{initials(entry.by)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="wrap-break-word text-lg font-bold leading-tight">{entry.by}</h3>
                    <time className="text-sm tabular-nums text-muted-foreground" dateTime={entry.date}>{formatCommentDate(entry.date)} น.</time>
                  </div>
                  <button type="button" className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded text-left text-base font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary" onClick={() => onSelect(entry.projectId)}>
                    <span className="wrap-break-word">{entry.title}</span><ArrowUpRight aria-hidden className="size-4 shrink-0" />
                  </button>
                  <p className="mt-2 whitespace-pre-wrap wrap-break-word text-lg leading-snug text-[#514653]">{entry.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <TablePagination page={page} total={filtered.length} onPageChange={setPage} />
        </>
      ) : (
        <div className="grid justify-items-center gap-2 px-5 py-12 text-center">
          <MessageSquareText aria-hidden className="size-7 text-primary" />
          <h3 className="text-xl font-bold">{search ? "ไม่พบความเห็นที่ตรงกัน" : "ยังไม่มีความเห็น"}</h3>
          {search && <Button variant="ghost" type="button" onClick={() => { setQuery(""); setPage(1); }}>ล้างคำค้นหา</Button>}
        </div>
      )}
    </Card>
  );
}
