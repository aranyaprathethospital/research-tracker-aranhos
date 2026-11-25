import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const zone = "Asia/Bangkok";
const dateLabel = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { dateStyle: "long", timeZone: zone });
const monthLabel = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { month: "long", year: "numeric", timeZone: zone });
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const weekdays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export default function ThaiDatePicker({ value, onChange }: {
  value: string;
  onChange: (date: string) => void;
}) {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: zone }).format(new Date());
  const [month, setMonth] = useState(() => new Date(`${(value || today).slice(0, 7)}-01T12:00:00Z`));
  const year = month.getUTCFullYear();
  const index = month.getUTCMonth();
  const offset = month.getUTCDay();
  const days = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();

  function moveMonth(direction: number) {
    setMonth(new Date(Date.UTC(year, index + direction, 1, 12)));
  }

  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2.5 text-sm font-medium text-primary">
        <CalendarDays aria-hidden className="size-4 shrink-0" />
        <span aria-live="polite">{value ? dateLabel.format(new Date(`${value}T12:00:00Z`)) : "ยังไม่ได้เลือกวัน"}</span>
      </div>
      <div className="mb-2 flex items-center justify-between gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="เดือนก่อนหน้า" onClick={() => moveMonth(-1)}><ChevronLeft /></Button>
        <p aria-live="polite" className="text-center text-sm font-semibold">{monthLabel.format(month)}</p>
        <Button type="button" variant="ghost" size="icon" aria-label="เดือนถัดไป" onClick={() => moveMonth(1)}><ChevronRight /></Button>
      </div>
      <div className="grid grid-cols-7 justify-items-center gap-y-1">
        {weekdays.map((day) => <span key={day} aria-hidden className="pb-1 text-xs text-muted-foreground">{day}</span>)}
        {Array.from({ length: offset }, (_, blank) => <span key={`empty-${blank}`} aria-hidden />)}
        {Array.from({ length: days }, (_, dayIndex) => {
          const day = dayIndex + 1;
          const date = new Date(Date.UTC(year, index, day, 12));
          const key = dateKey(date);
          const selected = key === value;
          return (
            <button key={key} type="button" aria-label={dateLabel.format(date)} aria-current={key === today ? "date" : undefined} aria-pressed={selected}
              onClick={() => onChange(key)}
              className={`grid min-h-9 w-full max-w-10 place-items-center rounded-lg text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-primary ${selected ? "bg-primary font-semibold text-white" : key === today ? "bg-secondary font-semibold text-primary" : "hover:bg-secondary/70"}`}
            >{day}</button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-end border-t border-border pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => { setMonth(new Date(`${today.slice(0, 7)}-01T12:00:00Z`)); onChange(today); }}>เลือกวันนี้</Button>
      </div>
    </div>
  );
}
