"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AccountSetupForm({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) return setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    setBusy(true);
    try {
      const response = await fetch("/api/account/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: name, email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "ตั้งค่าบัญชีไม่สำเร็จ");
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ตั้งค่าบัญชีไม่สำเร็จ");
      setBusy(false);
    }
  };

  return (
    <main aria-labelledby="setup-title">
      <h1 id="setup-title" className="text-4xl font-bold leading-none sm:text-5xl">ตั้งค่าการเข้าสู่ระบบสำรอง</h1>
      <p className="mt-3 text-lg text-muted-foreground">ตั้งอีเมลและรหัสผ่านไว้ใช้เมื่อ ProviderID ไม่พร้อมใช้งาน</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label htmlFor="setup-name" className="block space-y-2 text-sm font-semibold text-[#43384d]">ชื่อเต็ม<Input id="setup-name" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className="h-12 rounded-lg border-[#e5dfeb] px-3 text-base" /></label>
          <label htmlFor="setup-email" className="block space-y-2 text-sm font-semibold text-[#43384d]">Email<span className="relative block"><Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8b8294]" /><Input id="setup-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-lg border-[#e5dfeb] pl-10 text-base" /></span></label>
          <label htmlFor="setup-password" className="block space-y-2 text-sm font-semibold text-[#43384d]">รหัสผ่านใหม่<Input id="setup-password" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-lg border-[#e5dfeb] px-3 text-base" /><span className="block text-sm font-normal text-[#817989]">อย่างน้อย 6 ตัวอักษร</span></label>
          <label htmlFor="setup-confirm" className="block space-y-2 text-sm font-semibold text-[#43384d]">ยืนยันรหัสผ่าน<Input id="setup-confirm" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-12 rounded-lg border-[#e5dfeb] px-3 text-base" /></label>
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-800" role="alert">{error}</p>}
          <Button type="submit" disabled={busy} className="mt-2 h-12 w-full rounded-lg text-base">{busy ? "กำลังบันทึก…" : "บันทึกและเข้าใช้งาน"}</Button>
        </form>
    </main>
  );
}
