import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { ArrowDownRight, ArrowRight, BookOpenCheck, ChevronDown, CircleAlert } from "lucide-react";
import { type Research } from "@/lib/research-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dayDiff } from "./project-display";

export function MetricCard({ title, value, detail, icon: Icon, tone }: { title: string; value: number; detail: string; icon: typeof BookOpenCheck; tone: "violet" | "blue" | "green" | "rose" }) {
  const tones = { violet: "bg-[#f2edf7] text-[#704b8d]", blue: "bg-[#edf3fb] text-[#5473a1]", green: "bg-[#eef5e7] text-[#64813d]", rose: "bg-[#fff0ed] text-[#a85449]" };
  return <Card className="min-h-[144px] rounded-[1.5rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025] sm:min-h-[158px]">
    <CardContent className="p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><span className="grid size-10 place-items-center rounded-xl sm:size-11 sm:rounded-2xl"><span className={`grid size-full place-items-center rounded-[inherit] ${tones[tone]}`}><Icon className="size-5" /></span></span><ArrowDownRight className="size-4 text-[#b6aebb]" /></div><div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-[#33273f] sm:mt-4 sm:text-3xl">{String(value).padStart(2, "0")}</div><div className="mt-1 text-sm font-semibold text-[#51465c] sm:text-base">{title}</div><p className="mt-1 text-sm text-[#8b8292]">{detail}</p></CardContent>
  </Card>;
}

export function DeadlinePanel({ items, total, expanded, onToggle, onSelect, onViewAll }: { items: Research[]; total: number; expanded: boolean; onToggle: () => void; onSelect: (id: string) => void; onViewAll: () => void }) {
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

export function AttentionPanel({ items, total, onSelect, onViewAll }: { items: Research[]; total: number; onSelect: (id: string) => void; onViewAll: () => void }) {
  return <Card className="rounded-[1.5rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025]">
    <CardHeader className="flex flex-row items-center gap-3 px-5 pb-3 pt-5"><span className="grid size-10 place-items-center rounded-xl bg-[#fff0ed] text-[#a85449]"><CircleAlert className="size-5" /></span><div><CardTitle className="text-base font-semibold text-[#3e3348]">รายการที่ต้องติดตาม</CardTitle><p className="mt-1 text-sm text-[#817888]">มีเรื่องรอการดูแล {total} รายการ</p></div></CardHeader>
    <CardContent className="space-y-1 px-3 pb-4">
      {items.length ? items.map((item) => <button key={item.id} onClick={() => onSelect(item.id)} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left transition hover:bg-[#f8f6fa]"><span className="size-2 shrink-0 rounded-full bg-[#d98a70]" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#4c4057]">{item.issue || (item.review === "ขอแก้ไข" ? "ที่ปรึกษาขอให้ปรับแก้" : "เลยกำหนดส่ง")}</span><span className="mt-0.5 block text-sm text-[#8b8292]">{item.student} · {item.id}</span></span><ArrowRight className="size-4 shrink-0 text-[#9a91a0]" /></button>) : <p className="rounded-xl bg-[#faf9fb] px-3 py-6 text-center text-sm text-[#817888]">ไม่มีรายการค้างติดตาม</p>}
      {total > 0 && <Button variant="ghost" onClick={onViewAll} className="mt-1 h-10 w-full justify-center rounded-xl text-[#694786]">ดูรายการที่ต้องติดตาม <ArrowRight className="size-4" /></Button>}
    </CardContent>
  </Card>;
}
