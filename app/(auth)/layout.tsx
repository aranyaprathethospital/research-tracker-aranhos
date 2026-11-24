import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import heroLanding from "@/public/images/branding/hero-landing.png.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh place-items-center bg-[#f3eff5] px-4 py-6 text-foreground sm:px-8 sm:py-12">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-[#e5dce9] bg-white shadow-[0_24px_70px_-38px_rgba(53,29,70,.4)] lg:grid-cols-[.9fr_1fr]">
        <aside className="hidden min-w-0 flex-col justify-center gap-6 border-r border-[#e9dfee] bg-[#f5edf8] p-7 lg:flex xl:p-10">
          <div className="min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-[#dfd3e6]">
            <Image src={heroLanding} alt="" sizes="(min-width: 1200px) 470px, (min-width: 1024px) 42vw, 1px" className="block h-auto w-full" />
          </div>
          <div className="px-1">
            <h2 className="text-2xl font-semibold leading-snug text-[#3e2552]">ติดตามงานวิจัยทุกขั้นตอน</h2>
            <p className="mt-2 text-sm leading-6 text-[#695872]">ดูความคืบหน้า กำหนดส่ง และข้อเสนอแนะจากที่ปรึกษา</p>
          </div>
        </aside>
        <div className="flex min-w-0 flex-col justify-center px-5 py-7 sm:px-10 sm:py-10 lg:px-11 xl:px-16">
          <header className="mx-auto mb-7 w-full max-w-xl border-b border-[#ede7f0] pb-4">
            <Link href="/" className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <Image src="/images/branding/logo-horizontal.png.png" alt="Research Tracker" width={240} height={80} className="h-auto w-40 sm:w-48" />
            </Link>
          </header>
          <div className="mx-auto w-full max-w-xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
