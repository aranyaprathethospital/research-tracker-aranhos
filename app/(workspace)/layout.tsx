import type { ReactNode } from "react";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-[100svh] bg-[#f6f7fb] text-[#282239]">{children}</div>;
}
