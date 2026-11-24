"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password-policy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    setError("");
    if (newPassword !== confirm) return setError("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน");
    setBusy(true);
    try {
      const response = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      setBusy(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-[#e9e7ed] bg-white shadow-[0_16px_44px_rgba(47,39,57,.08)]">
      <CardHeader className="px-6 pt-7 sm:px-9 sm:pt-9">
        <span className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-[#f4eef8] px-3 py-1.5 text-sm font-semibold text-[#684783]"><KeyRound className="size-4" /> ความปลอดภัยบัญชี</span>
        <CardTitle className="text-2xl font-semibold tracking-tight text-[#30283a] sm:text-3xl">{forceChange ? "ตั้งรหัสผ่านใหม่ก่อนใช้งาน" : "เปลี่ยนรหัสผ่าน"}</CardTitle>
        <CardDescription className="text-base leading-7">กำหนดรหัสผ่านใหม่ตั้งแต่ 6 ถึง 128 ตัวอักษร</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 sm:px-9 sm:pb-9">
        <form onSubmit={submit} className="space-y-4">
          {!forceChange && <label htmlFor="current-password" className="block space-y-2 text-sm font-semibold text-[#43384d]">รหัสผ่านปัจจุบัน<Input id="current-password" required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="h-12 rounded-lg border-[#e5dfeb] px-3 text-base" /></label>}
          <label htmlFor="new-password" className="block space-y-2 text-sm font-semibold text-[#43384d]">รหัสผ่านใหม่<Input id="new-password" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="h-12 rounded-lg border-[#e5dfeb] px-3 text-base" /></label>
          <label htmlFor="confirm-password" className="block space-y-2 text-sm font-semibold text-[#43384d]">ยืนยันรหัสผ่านใหม่<Input id="confirm-password" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-12 rounded-lg border-[#e5dfeb] px-3 text-base" /></label>
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-800" role="alert">{error}</p>}
          <Button type="submit" disabled={busy} className="mt-2 h-12 w-full rounded-lg text-base">{busy ? "กำลังบันทึก…" : "บันทึกรหัสผ่าน"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
