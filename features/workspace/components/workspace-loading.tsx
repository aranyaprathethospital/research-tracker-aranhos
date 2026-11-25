import type { ReactNode } from "react";
import { LoadingShape, Placeholder } from "@/components/ui/page-loading";

export default function WorkspaceLoading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <LoadingShape label={label}>
      <div className="min-h-svh bg-[#f6f4f0] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#e7e0d9] bg-[#fffcf8] p-4 lg:block">
          <Placeholder className="mb-8 h-11 w-40" />
          {Array.from({ length: 5 }, (_, index) => <Placeholder key={index} className="mb-3 h-10 w-full" />)}
        </aside>
        <div>
          <div className="flex h-16 items-center justify-between border-b border-[#e7e0d9] bg-[#fffcf8] px-4 sm:px-8">
            <Placeholder className="h-5 w-32" />
            <Placeholder className="size-10 rounded-xl md:w-36" />
          </div>
          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 space-y-3 border-b border-border pb-6">
              <Placeholder className="h-12 w-56 max-w-full" />
              <Placeholder className="h-4 w-80 max-w-full" />
            </div>
            {children}
          </div>
        </div>
      </div>
    </LoadingShape>
  );
}

export function SummaryLoading() {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#e7e0d9] bg-[#fffcf8] xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-3 border-[#e7e0d9] p-4 first:border-r second:border-b nth-3:border-r nth-3:border-t xl:border-0 xl:not-last:border-r">
          <Placeholder className="size-9 rounded-lg" />
          <Placeholder className="h-7 w-12" />
          <Placeholder className="h-4 w-24 max-w-full" />
        </div>
      ))}
    </div>
  );
}
