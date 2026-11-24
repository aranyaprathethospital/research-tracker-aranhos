import type { ReactNode } from "react";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-[100svh] bg-[#f7f7fa] text-[#302a38]">{children}</div>;
}
