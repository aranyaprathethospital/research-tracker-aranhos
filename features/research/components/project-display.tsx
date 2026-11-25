import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { stages, type ReviewStatus } from "@/lib/research-types";
import { Badge } from "@/components/ui/badge";

export const reviews: ReviewStatus[] = ["ขอแก้ไข", "ยังไม่ส่งตรวจ", "ส่งตรวจ", "อนุมัติ"];

export const reviewLabels: Record<ReviewStatus, string> = {
  "ขอแก้ไข": "ส่งแก้ไข",
  "ยังไม่ส่งตรวจ": "รอตรวจสอบ",
  "ส่งตรวจ": "ตรวจสอบแล้ว",
  "อนุมัติ": "ดำเนินการการเสร็จสิ้น",
};

const progressWidths = ["w-[0%]", "w-[5%]", "w-[10%]", "w-[15%]", "w-[20%]", "w-[25%]", "w-[30%]", "w-[35%]", "w-[40%]", "w-[45%]", "w-[50%]", "w-[55%]", "w-[60%]", "w-[65%]", "w-[70%]", "w-[75%]", "w-[80%]", "w-[85%]", "w-[90%]", "w-[95%]", "w-full"] as const;

export const dayDiff = (date: string) => differenceInCalendarDays(parseISO(date), new Date());

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

export function DueDate({ date }: { date: string }) { const diff = dayDiff(date); return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm ${diff < 0 ? "font-semibold text-[#a74d42]" : diff <= 7 ? "font-semibold text-[#996b2d]" : "text-[#746c7d]"}`}><CalendarDays className="size-3.5" />{formatThaiDate(date)}</span>; }

export function Progress({ value }: { value: number }) { const width = progressWidths[Math.round(Math.min(100, Math.max(0, value)) / 5)] ?? "w-[0%]"; return <span className="flex min-w-24 flex-1 items-center gap-2"><span className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-[#efedf2]"><span className={`block h-full rounded-full bg-[#765196] transition-[width] duration-300 ${width}`} /></span><span className="w-9 text-right text-sm font-semibold tabular-nums text-[#62586c]">{value}%</span></span>; }
