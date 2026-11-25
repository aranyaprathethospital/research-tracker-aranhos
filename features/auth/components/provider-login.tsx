"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Eye, EyeOff, Fingerprint, LockKeyhole, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProviderLogin({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"provider" | "email" | null>(null);
  const [errorSource, setErrorSource] = useState<"provider" | "email">("provider");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const signIn = async () => {
    if (busy) return;
    setError("");
    setErrorSource("provider");
    setBusy("provider");
    try {
      const result = await authClient.signIn.social({ provider: "provider-id", callbackURL: "/" });
      if (result.error) throw new Error("เริ่มเชื่อมต่อ ProviderID ไม่สำเร็จ กรุณาลองอีกครั้ง");
    } catch {
      setError("เริ่มเชื่อมต่อ ProviderID ไม่สำเร็จ กรุณาลองอีกครั้งหรือติดต่อผู้ดูแลระบบ");
      setBusy(null);
    }
  };

  const signInWithEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setErrorSource("email");
    setBusy("email");
    try {
      const result = await authClient.signIn.email({ email: email.trim().toLowerCase(), password, callbackURL: "/" });
      if (result.error) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่ได้ตั้งค่าการเข้าสู่ระบบสำรอง");
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "เชื่อมต่อระบบเข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
      setBusy(null);
    }
  };

  return (
    <div className="mt-7 space-y-4">
      <Button type="button" onClick={signIn} disabled={!enabled || busy !== null} className="group h-14 w-full justify-between rounded-lg bg-[#543467] px-4 text-lg hover:bg-[#432756] sm:px-5">
        <span className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-white/12"><Fingerprint className="size-5" /></span>
          <span>{busy === "provider" ? "กำลังเชื่อมต่อ ProviderID…" : "เข้าสู่ระบบด้วย ProviderID"}</span>
        </span>
        <ArrowRight aria-hidden className="size-5 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
      </Button>
      {!enabled && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">ยังไม่ได้ตั้งค่าฐานข้อมูลหรือข้อมูลเชื่อมต่อ MOPH ตรวจสอบค่าที่ต้องตั้งค่าใน README.md</p>}

      {error && errorSource === "provider" && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-800" role="alert">{error}</p>}
      <details className="group rounded-lg border border-[#e8e0d9] bg-white">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-lg px-4 text-base font-bold text-[#543467] focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          <Mail aria-hidden className="size-4" />
          <span className="flex-1">เข้าสู่ระบบด้วยอีเมลสำรอง</span>
          <ChevronDown aria-hidden className="size-4 motion-safe:transition-transform group-open:rotate-180" />
        </summary>
        <form onSubmit={signInWithEmail} className="space-y-4 border-t border-[#e8e0d9] p-4">
          <label className="block space-y-2 text-base font-bold text-[#43384d]" htmlFor="login-email">
            อีเมล
            <span className="relative block">
              <Mail aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8b8294]" />
              <Input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10 text-base" />
            </span>
          </label>
          <div className="space-y-2">
            <label className="block text-base font-bold text-[#43384d]" htmlFor="login-password">รหัสผ่าน</label>
            <div className="relative">
              <LockKeyhole aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8b8294]" />
              <Input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pr-12 pl-10 text-base" />
              <Button type="button" size="icon" variant="ghost" aria-label="แสดงรหัสผ่าน" aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute top-1 right-1">
                {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </Button>
            </div>
          </div>
          {error && errorSource === "email" && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-800" role="alert">{error}</p>}
          <Button type="submit" variant="outline" disabled={busy !== null} className="h-12 w-full">
            {busy === "email" ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบด้วยอีเมล"}
          </Button>
          <p className="text-center text-sm leading-snug text-muted-foreground">ใช้ได้หลังจากเชื่อมบัญชี ProviderID และตั้งรหัสผ่านแล้ว</p>
        </form>
      </details>
    </div>
  );
}
