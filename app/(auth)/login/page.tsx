import { ShieldCheck } from "lucide-react";
import { isProviderIdConfigured } from "@/lib/provider-id";
import ProviderLogin from "@/features/auth/components/provider-login";

export default function LoginPage() {
  return (
    <main aria-labelledby="login-title">
      <h1 id="login-title" className="text-5xl font-bold leading-none tracking-tight text-[#30203e] sm:text-6xl">เข้าสู่ระบบ</h1>
      <p className="mt-3 text-lg leading-snug text-[#6f6378] sm:text-xl">
        ลงชื่อเข้าใช้เพื่อเปิดพื้นที่ทำงานวิจัยของคุณ
      </p>
      <ProviderLogin enabled={isProviderIdConfigured()} />
      <p className="mt-6 flex items-start gap-2.5 border-t border-[#e8e0d9] pt-4 text-base leading-snug text-[#6f6378]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        หากเข้าใช้ครั้งแรก ให้ผู้ดูแลลงทะเบียนชื่อและ CID ของคุณก่อน
      </p>
    </main>
  );
}
