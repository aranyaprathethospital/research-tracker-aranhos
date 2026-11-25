import type { ReactNode } from "react";
import WorkspaceStatus from "@/components/status/workspace-status";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-[100svh] bg-[#f7f7fa] text-[#302a38] print:min-h-0 print:bg-white"><WorkspaceStatus>{children}</WorkspaceStatus></div>;
}
