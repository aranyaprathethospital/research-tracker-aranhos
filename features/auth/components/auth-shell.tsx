import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import heroLanding from "@/public/images/branding/hero-landing.png.png";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-[#f3f0ec] text-foreground lg:grid lg:grid-cols-[minmax(0,1.03fr)_minmax(0,1fr)]">
      <aside className="relative hidden items-center border-r border-[#e8dfd7] bg-[#eae3dd] px-[clamp(2rem,5vw,6rem)] py-12 lg:flex">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#634079]" aria-hidden />
        <div className="mx-auto w-full max-w-[610px]">
          <div className="border-t border-[#b8a69e] pt-7 xl:pt-10">
            <p className="text-lg font-bold text-[#634079]">โรงพยาบาลอรัญประเทศ</p>
            <p className="mt-2 text-5xl font-bold leading-[.95] tracking-tight text-[#33233a] xl:text-7xl">
              พื้นที่ทำงานวิจัย<br />และการให้คำปรึกษา
            </p>
          </div>
          <figure className="mt-8 border border-white/80 bg-[#f8f4ef] p-2 shadow-[0_34px_52px_-40px_#4f334f85] xl:mt-10 xl:p-3">
            <Image src={heroLanding} alt="" loading="lazy" sizes="(min-width: 1440px) 560px, (min-width: 1024px) 39vw, 1px" className="block h-auto w-full" />
          </figure>
          <p className="mt-5 text-xl leading-snug text-[#63565e]">ติดตามความคืบหน้า กำหนดส่ง และข้อเสนอแนะจากที่ปรึกษา</p>
        </div>
      </aside>
      <div className="relative flex min-h-svh min-w-0 flex-col justify-center bg-[#fffcf8] px-5 py-8 sm:px-12 sm:py-12 lg:px-[clamp(2.5rem,6vw,7rem)]">
        <div className="mx-auto w-full max-w-[32rem]">
          <header className="mb-7 border-b border-[#e8e0d9] pb-5 sm:mb-10 sm:pb-6">
            <Link href="/" aria-label="Research Tracker หน้าแรก" className="inline-flex max-w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <Image src="/images/branding/logo-horizontal.png.png" alt="Research Tracker" width={244} height={81} sizes="(min-width: 640px) 208px, 176px" className="h-auto w-44 object-contain sm:w-52" />
            </Link>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
