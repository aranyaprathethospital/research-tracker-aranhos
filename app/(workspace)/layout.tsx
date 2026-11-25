import type { ReactNode } from "react";
import WorkspaceStatus from "@/components/status/workspace-status";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-[#f6f4f0] text-foreground print:min-h-0 print:bg-white"><WorkspaceStatus>{children}</WorkspaceStatus></div>;
}
