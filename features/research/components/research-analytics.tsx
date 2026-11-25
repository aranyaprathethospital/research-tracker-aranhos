import type { ReactNode } from "react";
import { ArrowUpRight, CalendarDays, ChartNoAxesCombined, Layers3, ScanLine } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { stages, type Research } from "@/lib/research-types";
import { reviewLabels, reviews } from "./project-display";

const colors = ["#a94557", "#7751a1", "#367092", "#527837"];
const monthKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" });
const monthLabel = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", month: "short" });
const bangkokDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok" });
const tooltipStyle = { borderRadius: 12, borderColor: "#e9e4ee", boxShadow: "0 8px 24px #26183914" };

function ChartPanel({ icon, title, description, children }: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-white p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">{icon}</span>
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ResearchAnalytics({ items, onSelectStage }: {
  items: Research[];
  onSelectStage: (stage: number) => void;
}) {
  const total = items.length;
  const percent = (count: number) => total ? Math.round(count * 100 / total) : 0;
  const stageCounts = stages.map((name, index) => ({ name, count: items.filter((item) => item.stage === index).length }));
  const reviewCounts = reviews.map((review, index) => ({
    name: reviewLabels[review], count: items.filter((item) => item.review === review).length, color: colors[index],
  }));
  const now = new Date();
  const [year, month] = bangkokDay.format(now).split("-").map(Number);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 6 + index, 1, 12));
    return { key: monthKey.format(date), name: monthLabel.format(date), count: 0 };
  });
  const monthsByKey = new Map(months.map((entry) => [entry.key, entry]));
  const deadlineCounts = [0, 0, 0, 0, 0];
  const today = Date.parse(bangkokDay.format(now));
  for (const item of items) {
    const due = Date.parse(item.dueDate);
    const days = (due - today) / 86_400_000;
    const bucket = !Number.isFinite(days) ? 4 : days < 0 ? 0 : days <= 7 ? 1 : days <= 14 ? 2 : 3;
    deadlineCounts[bucket] += 1;
    for (const event of item.history) {
      const date = new Date(event.date);
      if (!Number.isFinite(date.getTime())) continue;
      const entry = monthsByKey.get(monthKey.format(date));
      if (entry) entry.count += 1;
    }
  }

  if (!total) {
    return <p className="mb-6 rounded-2xl border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted-foreground">เมื่อมีโครงการในมุมมองของคุณ ระบบจะแสดงกราฟสรุปที่นี่</p>;
  }

  return (
    <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <ChartPanel icon={<Layers3 className="size-5" />} title="โครงการตามขั้นตอน" description="เลือกแถบเพื่อเปิดรายการในขั้นตอนนั้น">
        <div className="space-y-1">
          {stageCounts.map(({ name, count }, index) => (
            <button type="button" key={name} onClick={() => onSelectStage(index)} className="group block w-full rounded-lg p-2 text-left hover:bg-secondary/50 focus-visible:outline-2 focus-visible:outline-primary">
              <span className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 font-medium text-foreground">{name}</span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums text-muted-foreground">{count} โครงการ <ArrowUpRight aria-hidden className="size-3.5 text-primary" /></span>
              </span>
              <progress aria-hidden="true" value={count} max={total} className="block h-2 w-full appearance-none overflow-hidden rounded-full bg-secondary [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary" />
              <span className="sr-only">{percent(count)}% ของโครงการ</span>
            </button>
          ))}
        </div>
      </ChartPanel>

      <ChartPanel icon={<ScanLine className="size-5" />} title="สถานะการตรวจ" description="นับตามสถานะของที่ปรึกษาหลัก โครงการละหนึ่งสถานะ">
        <div className="relative h-44" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={reviewCounts.filter((entry) => entry.count)} dataKey="count" nameKey="name" innerRadius="62%" outerRadius="86%" stroke="none" isAnimationActive={false}>
                {reviewCounts.filter((entry) => entry.count).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} โครงการ`, "จำนวน"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid content-center justify-items-center">
            <strong className="text-3xl tabular-nums">{total}</strong>
            <span className="text-xs text-muted-foreground">โครงการ</span>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {reviewCounts.map((entry, index) => <li key={entry.name} className="flex items-center gap-2 py-2 text-sm">
            <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${["bg-[#a94557]", "bg-[#7751a1]", "bg-[#367092]", "bg-[#527837]"][index]}`} />
            <span className="flex-1">{entry.name}</span>
            <strong className="tabular-nums">{entry.count}</strong>
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{percent(entry.count)}%</span>
          </li>)}
        </ul>
      </ChartPanel>

      <ChartPanel icon={<ChartNoAxesCombined className="size-5" />} title="กิจกรรมย้อนหลัง 6 เดือน" description="จำนวนรายการในประวัติการอัปเดตของโครงการ">
        <div className="h-44" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months}>
              <CartesianGrid vertical={false} stroke="#eee8f1" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} ครั้ง`, "อัปเดต"]} />
              <Bar dataKey="count" fill="#7751a1" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          {months.map((entry) => <li key={entry.key} className="rounded-lg bg-secondary/40 p-2 text-xs text-muted-foreground">{entry.name}<strong className="mt-1 block text-sm tabular-nums text-foreground">{entry.count}</strong></li>)}
        </ul>
      </ChartPanel>

      <ChartPanel icon={<CalendarDays className="size-5" />} title="กำหนดส่ง" description="จัดกลุ่มตามวันครบกำหนดของแต่ละโครงการ">
        <ul className="space-y-2">
          {["เลยกำหนด", "วันนี้–7 วัน", "อีก 8–14 วัน", "มากกว่า 14 วัน", "ยังไม่ระบุวัน"].map((label, index) => (
            <li key={label} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2.5 text-sm">
              <span className={index === 0 ? "font-semibold text-rose-700" : "text-foreground"}>{label}</span>
              <strong className="tabular-nums">{deadlineCounts[index]} <span className="font-normal text-muted-foreground">โครงการ</span></strong>
            </li>
          ))}
        </ul>
      </ChartPanel>
    </div>
  );
}
