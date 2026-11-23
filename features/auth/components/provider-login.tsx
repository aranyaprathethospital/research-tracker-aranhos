"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Fingerprint, LockKeyhole, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProviderLogin({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await authClient.signIn.social({ provider: "provider-id", callbackURL: "/" });
      if (result.error) throw new Error("เริ่มเชื่อมต่อ ProviderID ไม่สำเร็จ กรุณาลองอีกครั้ง");
    } catch {
      setError("เริ่มเชื่อมต่อ ProviderID ไม่สำเร็จ กรุณาลองอีกครั้งหรือติดต่อผู้ดูแลระบบ");
      setLoading(false);
    }
  };

  const signInWithEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authClient.signIn.email({ email: email.trim().toLowerCase(), password, callbackURL: "/" });
      if (result.error) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่ได้ตั้งค่าการเข้าสู่ระบบสำรอง");
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "เชื่อมต่อระบบเข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-7 space-y-5">
      <Button onClick={signIn} disabled={!enabled || loading} className="h-14 w-full justify-between rounded-2xl bg-[#65418a] px-4 text-base shadow-[0_10px_24px_rgba(101,65,138,.2)] hover:bg-[#533473] sm:px-5">
        <span className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white/15"><Fingerprint className="size-5" /></span>
          <span>{loading ? "กำลังเชื่อมต่อ ProviderID…" : "เข้าสู่ระบบด้วย ProviderID"}</span>
        </span>
        <ArrowRight className="size-5" />
      </Button>
      {!enabled && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">ยังไม่ได้ตั้งค่าฐานข้อมูลหรือข้อมูลเชื่อมต่อ MOPH ตรวจสอบค่าที่ต้องตั้งค่าใน README.md</p>}

      <div className="flex items-center gap-3 text-sm text-[#8b8392]">
        <span className="h-px flex-1 bg-[#ece8f0]" />
        <span>หรือใช้บัญชีสำรอง</span>
        <span className="h-px flex-1 bg-[#ece8f0]" />
      </div>

      <form onSubmit={signInWithEmail} className="space-y-4">
        <label className="block space-y-2 text-sm font-semibold text-[#43384d]" htmlFor="login-email">
          Email
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8b8294]" />
            <Input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="h-12 rounded-xl border-[#e5dfeb] bg-white pl-10 text-base focus-visible:border-[#9a78b7] focus-visible:ring-[#9a78b7]/20" />
          </span>
        </label>
        <label className="block space-y-2 text-sm font-semibold text-[#43384d]" htmlFor="login-password">
          รหัสผ่าน
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8b8294]" />
            <Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="รหัสผ่านของคุณ" className="h-12 rounded-xl border-[#e5dfeb] bg-white pl-10 text-base focus-visible:border-[#9a78b7] focus-visible:ring-[#9a78b7]/20" />
          </span>
        </label>
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800" role="alert">{error}</p>}
        <Button type="submit" variant="outline" disabled={loading} className="h-12 w-full rounded-xl border-[#e3dce9] bg-white text-base text-[#49375a] hover:bg-[#faf8fc]">
          {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบด้วย Email"}
        </Button>
        <p className="text-center text-sm leading-6 text-[#817989]">ใช้ได้หลังจากเชื่อมบัญชี ProviderID และตั้งรหัสผ่านแล้ว</p>
      </form>
    </div>
  );
}
