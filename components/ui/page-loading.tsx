import Image from "next/image";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingShape({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function Placeholder({ className }: { className: string }) {
  return <Skeleton className={`bg-[#eae4e4] motion-reduce:animate-none ${className}`} />;
}

export default function PageLoading() {
  return (
    <div className="grid min-h-svh place-items-center bg-[#f6f4f0] px-4">
      <div role="status" className="flex w-full max-w-xs flex-col items-center rounded-xl border border-[#e7e0d9] bg-[#fffcf8] px-8 py-10">
        <div className="relative grid size-20 place-items-center">
          <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-secondary border-t-primary motion-safe:animate-spin" />
          <Image src="/favicons/android-chrome-192x192.png" width={44} height={44} alt="" className="size-11 object-contain" />
        </div>
        <p className="mt-5 text-xl font-bold text-foreground">กำลังโหลด Research Tracker</p>
      </div>
    </div>
  );
}
