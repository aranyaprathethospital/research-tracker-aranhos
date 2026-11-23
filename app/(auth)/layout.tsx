import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-[#f8f8fb] text-[#282239]">
      <div className="mx-auto grid min-h-[100svh] max-w-[1600px] lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,.92fr)]">
        <aside className="relative hidden min-h-[100svh] overflow-hidden bg-gradient-to-br from-[#f3eafd] via-[#fbfaff] to-[#eff8e9] px-12 py-10 lg:flex lg:flex-col xl:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(117,61,150,.12),transparent_36%),radial-gradient(circle_at_90%_80%,rgba(104,176,53,.14),transparent_34%)]" />
          <Link href="/" className="relative z-10 inline-flex w-fit rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-white/80" aria-label="Research Tracker">
            <Image src="/images/branding/logo-horizontal.png.png" alt="Research Tracker" width={320} height={107} priority className="h-auto w-64 object-contain" />
          </Link>
          <div className="relative z-10 mt-16 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e8dff0] bg-white/70 px-3 py-1.5 text-sm font-semibold text-[#65417f]">
              <span className="size-2 rounded-full bg-[#79ae3b]" /> Research workspace
            </span>
            <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-[#332340] xl:text-5xl">
              งานวิจัยเดินหน้าได้ดี เมื่อทุกคนเห็นภาพเดียวกัน
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-[#71677c]">
              ติดตามความคืบหน้า กำหนดส่ง และความเห็นจากที่ปรึกษาในพื้นที่ทำงานเดียว
            </p>
          </div>
          <div className="relative mt-auto flex justify-center pt-8">
            <Image src="/images/branding/hero-landing.png.png" alt="ภาพประกอบการติดตามงานวิจัย" width={1000} height={600} priority className="h-auto w-full max-w-[680px] object-contain drop-shadow-[0_28px_50px_rgba(69,42,97,.12)]" />
          </div>
          <p className="relative z-10 mt-4 text-sm text-[#867c91]">ระบบติดตามความก้าวหน้างานวิจัย</p>
        </aside>

        <main className="flex min-h-[100svh] items-center justify-center px-4 py-8 sm:px-8 sm:py-12 lg:px-10 xl:px-16">
          <div className="w-full max-w-xl">
            <Link href="/" className="mb-7 inline-flex rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-[#eeeaf2] lg:hidden" aria-label="Research Tracker">
              <Image src="/images/branding/logo-horizontal.png.png" alt="Research Tracker" width={240} height={80} priority className="h-auto w-48 object-contain" />
            </Link>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
