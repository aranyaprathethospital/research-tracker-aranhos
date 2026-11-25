import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightLeft, FileQuestion, LockKeyhole, LogIn, ShieldAlert, TriangleAlert, WifiOff } from "lucide-react";

const icons = {
  missing: FileQuestion,
  error: TriangleAlert,
  forbidden: ShieldAlert,
  role: LockKeyhole,
  mode: ArrowRightLeft,
  session: LogIn,
  offline: WifiOff,
};

export function StatusLink({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Link href={href} className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${secondary ? "border border-border bg-white text-primary hover:bg-secondary" : "bg-primary text-white hover:opacity-90"}`}>{children}</Link>;
}

export default function StatusPanel({ kind, code, title, description, children, reference, embedded = false }: {
  kind: keyof typeof icons;
  code?: string;
  title: string;
  description: string;
  children?: ReactNode;
  reference?: string;
  embedded?: boolean;
}) {
  const Icon = icons[kind];
  const Heading = embedded ? "h2" : "h1";
  return (
    <div className={embedded ? "my-4" : "grid min-h-svh place-items-center bg-[#f6f4f0] px-4 py-10 sm:px-6"}>
      <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-[#e7e0d9] border-t-4 border-t-[#735388] bg-[#fffcf8] shadow-[0_24px_56px_-38px_#40264b55]">
        {!embedded && <div className="flex items-center gap-3 border-b border-[#e7e0d9] px-5 py-4 sm:px-8">
          <Image src="/favicons/android-chrome-192x192.png" alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
          <span className="text-xl font-bold text-[#513d5d]">Research Tracker</span>
        </div>}
        <div className="px-5 py-7 sm:px-8 sm:py-10">
          <div className="mb-3 flex items-center gap-3">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eee5f4] text-primary"><Icon className="size-5" /></span>
            {code && <span className="text-sm font-bold tabular-nums text-primary">{code}</span>}
          </div>
          <Heading className="text-4xl font-bold leading-none text-foreground sm:text-5xl">{title}</Heading>
          <p className="mt-3 max-w-xl text-lg leading-snug text-muted-foreground">{description}</p>
          {reference && <p className="mt-4 break-all text-sm text-muted-foreground">รหัสอ้างอิง {reference}</p>}
          {children && <div className="mt-6 flex flex-wrap gap-2.5">{children}</div>}
        </div>
      </section>
    </div>
  );
}
