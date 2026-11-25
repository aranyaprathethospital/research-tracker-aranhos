"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenCheck, GraduationCap, TriangleAlert } from "lucide-react";

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
    <main aria-labelledby="role-title">
      <h1 id="role-title" className="text-4xl font-bold leading-none tracking-tight sm:text-5xl">เลือกโหมดการทำงาน</h1>
      <p className="mt-3 text-lg text-muted-foreground">สลับโหมดได้ภายหลังจากเมนูโปรไฟล์</p>
      <div className="mt-6">
        {modes.length === 0 ? <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><TriangleAlert className="mt-0.5 size-5 shrink-0" />บัญชีนี้ยังไม่ได้รับสิทธิ์ Advisor หรือ Advisee โปรดติดต่อ PM</div> :
          <div className="grid gap-3">
            {modes.map((mode) => {
              const advisor = mode === "ADVISOR";
              const Icon = advisor ? BookOpenCheck : GraduationCap;
              return <button key={mode} type="button" onClick={() => void choose(mode)} disabled={busy !== null} className="group flex items-start gap-3 rounded-lg border border-[#e7e0d9] bg-white p-4 text-left transition-colors hover:border-[#cfc2da] hover:bg-[#faf6fa] focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 sm:gap-4 sm:p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Icon aria-hidden className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-bold leading-tight">{advisor ? "ที่ปรึกษา · Advisor" : "นักวิจัย · Advisee"}</span>
                  <span className="mt-0.5 block text-base leading-snug text-muted-foreground">{advisor ? "ตรวจโครงการที่ได้รับมอบหมายและให้ความเห็น" : "อัปเดตและติดตามงานวิจัยของคุณ"}</span>
                  {busy === mode && <span role="status" className="mt-2 block text-base font-bold text-primary">กำลังเปลี่ยนโหมด…</span>}
                </span>
                <ArrowRight aria-hidden className="mt-2 size-4 shrink-0 text-primary motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
              </button>;
            })}
          </div>}
        {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
      </div>
    </main>
  );
}
