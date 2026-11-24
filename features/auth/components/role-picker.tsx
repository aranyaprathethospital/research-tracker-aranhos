"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenCheck, GraduationCap, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Mode = "ADVISOR" | "ADVISEE";

export default function RolePicker({ modes }: { modes: Mode[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Mode | null>(null);
  const [error, setError] = useState("");
  const choose = async (mode: Mode) => {
    setBusy(mode);
    setError("");
    try {
      const response = await fetch("/api/profile/mode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "เปลี่ยนโหมดไม่สำเร็จ");
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "เปลี่ยนโหมดไม่สำเร็จ");
      setBusy(null);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border-[#e9e7ed] bg-white shadow-[0_16px_44px_rgba(47,39,57,.08)]">
      <CardHeader className="px-6 pt-7 sm:px-9 sm:pt-9">
        <span className="mb-2 inline-flex w-fit rounded-full bg-[#f4eef8] px-3 py-1.5 text-sm font-semibold text-[#684783]">Research Tracker</span>
        <CardTitle className="text-2xl font-semibold tracking-tight text-[#30283a] sm:text-3xl">เลือกโหมดการทำงาน</CardTitle>
        <CardDescription className="text-base leading-7">เลือกบทบาทสำหรับรอบการใช้งานนี้ และเปลี่ยนโหมดได้ภายหลัง</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 sm:px-9 sm:pb-9">
        {modes.length === 0 ? <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><TriangleAlert className="mt-0.5 size-5 shrink-0" />บัญชีนี้ยังไม่ได้รับสิทธิ์ Advisor หรือ Advisee โปรดติดต่อ PM</div> :
          <div className="grid gap-3 sm:grid-cols-2">
            {modes.map((mode) => {
              const advisor = mode === "ADVISOR";
              const Icon = advisor ? BookOpenCheck : GraduationCap;
              return <button key={mode} onClick={() => void choose(mode)} disabled={busy !== null} className="group min-h-48 rounded-xl border border-[#e8e5ec] bg-white p-5 text-left transition-colors hover:border-[#cfc2da] hover:bg-[#fbf9fc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/20 disabled:opacity-60 sm:p-6">
                <span className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-[#f4eef8] text-[#704b8d]"><Icon className="size-6" /></span><ArrowRight className="size-5 text-[#a298aa] transition group-hover:translate-x-1 group-hover:text-[#704b8d]" /></span>
                <span className="mt-5 block text-lg font-semibold text-[#382a45]">{advisor ? "Advisor · ที่ปรึกษา" : "Advisee · นักวิจัย"}</span>
                <span className="mt-2 block text-sm leading-6 text-[#766d80]">{advisor ? "ดูงานที่ได้รับมอบหมายและให้ความเห็นแยกตามโครงการ" : "ติดตามความคืบหน้าและจัดการงานวิจัยของคุณ"}</span>
                {busy === mode && <span className="mt-3 block text-sm font-medium text-[#704b8d]">กำลังเปลี่ยนโหมด…</span>}
              </button>;
            })}
          </div>}
        {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
        {busy && <Button disabled className="sr-only">กำลังเปลี่ยนโหมด</Button>}
      </CardContent>
    </Card>
  );
}
