import Link from "next/link";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { ArrowUpRight, CalendarDays, Check, CircleAlert, ChevronRight, type LucideIcon } from "lucide-react";
import type { Research } from "@/lib/research-types";
import { Card } from "@/components/ui/card";
import { dayDiff } from "./project-display";

const metricTones = {
  violet: "bg-[#eee6f1] text-[#68447d]",
  blue: "bg-[#e8edf3] text-[#466382]",
  green: "bg-[#eaf0e4] text-[#4c6a3b]",
  rose: "bg-[#f5e9e6] text-[#974b45]",
};

export function MetricCard({ title, value, icon: Icon, tone, href }: { title: string; value: number; icon: LucideIcon; tone: keyof typeof metricTones; href?: string }) {
  const className = "group block min-w-0 border-[#e6dfd9] px-4 py-4 first:border-r second:border-b nth-3:border-r nth-3:border-t sm:px-6 xl:border-0";
  const content = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-lg ${metricTones[tone]}`}><Icon className="size-[17px]" /></span>
        {href && <ArrowUpRight aria-hidden className="size-4 text-[#766581] motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />}
      </span>
      <span className="mt-2.5 block text-4xl font-bold leading-none tabular-nums tracking-tight text-[#33253b] sm:text-5xl">{value}</span>
      <span className="mt-1 block text-base font-bold leading-tight text-[#5a4b60] sm:text-lg">{title}</span>
    </>
  );
  return href
    ? <Link href={href} className={`${className} hover:bg-[#f5eff5] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary`}>{content}</Link>
    : <div className={className}>{content}</div>;
}

type PanelProps = { items: Research[]; total: number; onSelect: (id: string) => void };

export function DeadlinePanel(props: PanelProps) {
  return <QueuePanel {...props} kind="due" />;
}

export function AttentionPanel(props: PanelProps) {
  return <QueuePanel {...props} kind="attention" />;
}

function QueuePanel({ items, total, onSelect, kind }: PanelProps & { kind: "due" | "attention" }) {
  const due = kind === "due";
  const Icon = due ? CalendarDays : CircleAlert;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee8e2] px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon aria-hidden className={`size-[18px] shrink-0 ${due ? "text-[#587246]" : "text-[#984f48]"}`} />
          <h2 className="text-xl font-bold leading-tight">{due ? "กำหนดส่งใน 14 วัน" : "รายการที่ต้องติดตาม"}</h2>
        </div>
        {total > 0 && <Link href={`/projects?filter=${kind}`} className="rounded text-base font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">ดูทั้งหมด {total} รายการ</Link>}
      </div>
      {items.length > 0 ? (
        <ul className="divide-y divide-[#eee8e2]">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => onSelect(item.id)} className="group flex min-h-[4.25rem] w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#fbf8f5] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:px-5">
                {due ? <time dateTime={item.dueDate} className="grid min-w-11 shrink-0 justify-items-center rounded-md bg-[#edf1e8] px-1 py-1 leading-none text-[#486037]">
                  <span className="text-xl font-bold tabular-nums">{format(parseISO(item.dueDate), "d")}</span>
                  <span className="text-sm">{format(parseISO(item.dueDate), "MMM", { locale: th })}</span>
                </time> : <span aria-hidden className="size-2 shrink-0 rounded-full bg-[#ac6b5e]" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-bold leading-tight">{item.title}</span>
                  <span className="mt-0.5 block truncate text-base leading-tight text-muted-foreground">{due ? item.student : item.issue || (item.review === "ขอแก้ไข" ? "ที่ปรึกษาขอให้ปรับแก้" : "เลยกำหนดส่ง")}</span>
                </span>
                {due && <span className="shrink-0 text-sm font-bold text-[#536648]">{dayDiff(item.dueDate) === 0 ? "วันนี้" : `อีก ${dayDiff(item.dueDate)} วัน`}</span>}
                <ChevronRight aria-hidden className="size-4 shrink-0 text-[#8a798c] group-hover:text-primary" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex min-h-[4.25rem] items-center gap-2.5 px-4 py-3 text-base text-[#655c69] sm:px-5">
          <Check aria-hidden className="size-4 shrink-0 text-[#557442]" />{due ? "ยังไม่มีงานที่ครบกำหนดในช่วงนี้" : "ไม่มีรายการค้างติดตาม"}
        </p>
      )}
    </Card>
  );
}
