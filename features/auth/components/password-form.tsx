"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PasswordChangeForm({ forceChange }: { forceChange: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (newPassword !== confirm) return setError("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน");
    setBusy(true);
    try {
      const response = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      toast.success("เปลี่ยนรหัสผ่านแล้ว");
      router.replace(forceChange ? "/" : "/profile");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      setBusy(false);
    }
  };

  return (
    <main aria-labelledby="change-password-title">
      {!forceChange && <Link href="/profile" className="mb-4 inline-flex min-h-9 items-center gap-2 rounded text-base font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft aria-hidden className="size-4" />กลับไปที่โปรไฟล์</Link>}
      <h1 id="change-password-title" className="text-4xl font-bold leading-none sm:text-5xl">{forceChange ? "ตั้งรหัสผ่านใหม่ก่อนใช้งาน" : "เปลี่ยนรหัสผ่าน"}</h1>
      <p className="mt-3 text-lg text-muted-foreground">กำหนดรหัสผ่านใหม่ตั้งแต่ 6 ถึง 128 ตัวอักษร</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {!forceChange && <label htmlFor="current-password" className="block space-y-2 text-sm font-semibold text-[#43384d]">รหัสผ่านปัจจุบัน<Input id="current-password" required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="h-12 rounded-lg border-[#e5dfeb] px-3 text-base" /></label>}
          <label htmlFor="new-password" className="block space-y-2 text-sm font-semibold text-[#43384d]">รหัสผ่านใหม่<Input id="new-password" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="h-12 rounded-lg border-[#e5dfeb] px-3 text-base" /></label>
          <label htmlFor="confirm-password" className="block space-y-2 text-sm font-semibold text-[#43384d]">ยืนยันรหัสผ่านใหม่<Input id="confirm-password" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-12 rounded-lg border-[#e5dfeb] px-3 text-base" /></label>
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-800" role="alert">{error}</p>}
          <Button type="submit" disabled={busy} className="mt-2 h-12 w-full rounded-lg text-base">{busy ? "กำลังบันทึก…" : "บันทึกรหัสผ่าน"}</Button>
        </form>
    </main>
  );
}
