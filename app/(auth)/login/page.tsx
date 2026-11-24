import { CheckCircle2, ShieldCheck } from "lucide-react";
import { isProviderIdConfigured } from "@/lib/provider-id";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProviderLogin from "@/features/auth/components/provider-login";

export default async function LoginPage() {
  const enabled = isProviderIdConfigured();

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-white p-0 shadow-[0_30px_90px_rgba(57,39,74,.12)] ring-1 ring-[#e9e3ef]">
        <div className="h-1.5 bg-gradient-to-r from-[#7750a4] via-[#9270bd] to-[#85aa56]" />
        <CardHeader className="gap-3 px-6 pt-8 sm:px-9 sm:pt-10">
          <div className="mb-1 inline-flex w-fit items-center gap-2 rounded-full border border-[#e9e2ef] bg-[#faf8fc] px-3 py-1.5 text-sm font-semibold text-[#674483]">
            <span className="size-2 rounded-full bg-[#85aa56]" /> พื้นที่ทำงานวิจัย
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-[#30243c] sm:text-4xl">ยินดีต้อนรับ</CardTitle>
          <CardDescription className="text-base leading-7 text-[#746b7e]">
            ลงชื่อเข้าใช้เพื่อติดตามงานวิจัยและทำงานร่วมกับทีมของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-7 sm:px-9 sm:pb-9">
          <ProviderLogin enabled={enabled} />
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f7f4fa] p-4 text-sm leading-6 text-[#665b70]">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#79539a]" />
            <p>เข้าสู่ระบบได้เมื่อมีรายชื่อและ CID ที่ลงทะเบียนไว้กับผู้ดูแลระบบแล้ว</p>
          </div>
        </CardContent>
      </Card>
      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[#817989]">
        <CheckCircle2 className="size-4 text-[#7ea34a]" /> ระบบติดตามความก้าวหน้างานวิจัย
      </div>
    </div>
  );
}
