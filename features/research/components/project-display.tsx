import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { reviewLabels, stages, type ReviewStatus } from "@/lib/research-types";
import { Badge } from "@/components/ui/badge";

export const reviews: ReviewStatus[] = ["ขอแก้ไข", "ยังไม่ส่งตรวจ", "ส่งตรวจ", "อนุมัติ"];

export { reviewLabels };

const bangkokDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" });
const bangkokTimestamp = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok", hourCycle: "h23" });

export const dayDiff = (date: string) => differenceInCalendarDays(parseISO(date), parseISO(bangkokDate.format(new Date())));

export const formatCommentDate = (date: string) => bangkokTimestamp.format(new Date(date));

export const formatThaiDate = (date: string, withYear = false) => format(parseISO(date), withYear ? "d MMM yyyy" : "d MMM", { locale: th });

export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") || "RT";

const reviewTone = (status: ReviewStatus) => {
  if (status === "อนุมัติ") return "border-[#dcebd1] bg-[#eff7e9] text-[#4e702f]";
  if (status === "ขอแก้ไข") return "border-[#f3d7d2] bg-[#fff2ef] text-[#a44e43]";
  if (status === "ส่งตรวจ") return "border-[#d9e5f4] bg-[#f0f5fc] text-[#4b6d9d]";
  return "border-[#e8e4ec] bg-[#f7f6f8] text-[#71697b]";
};

export function StageBadge({ stage }: { stage: number }) { return <Badge variant="outline" className="h-7 max-w-full rounded-full border-[#e8e3ed] bg-[#faf8fc] px-2.5 text-xs font-medium text-[#655a70]"><span className="mr-1.5 size-1.5 shrink-0 rounded-full bg-[#80609b]" />{stages[stage] ?? "ไม่ระบุขั้นตอน"}</Badge>; }

export function ReviewBadge({ status }: { status: ReviewStatus }) { return <Badge variant="outline" className={`h-7 shrink-0 rounded-full px-2.5 text-xs font-semibold ${reviewTone(status)}`}>{reviewLabels[status]}</Badge>; }

export function DueDate({ date }: { date: string }) {
  if (!date) return <span className="whitespace-nowrap text-sm text-muted-foreground">ไม่ระบุกำหนด</span>;
  const diff = dayDiff(date);
  return <time dateTime={date} className={`inline-flex items-center gap-1.5 whitespace-nowrap text-base ${diff < 0 ? "font-bold text-[#a74d42]" : diff <= 7 ? "font-bold text-[#805b27]" : "text-[#746c7d]"}`}><CalendarDays aria-hidden className="size-3.5" />{formatThaiDate(date)}</time>;
}

export function Progress({ value }: { value: number }) {
  return (
    <span className="flex min-w-24 flex-1 items-center gap-2">
      <progress aria-label="ความคืบหน้า" max={100} value={value} className="block h-1.5 min-w-12 flex-1 appearance-none overflow-hidden rounded-full bg-secondary [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary" />
      <span aria-hidden className="w-9 text-right text-base font-bold tabular-nums text-[#62586c]">{value}%</span>
    </span>
  );
}
