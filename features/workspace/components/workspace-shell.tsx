"use client";

import { workspaceFetch } from "@/lib/workspace-fetch";
import { useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import ProfileMenu from "@/features/workspace/components/profile-menu";
import { NotificationBell } from "./notifications";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import WorkspaceSidebar from "@/features/workspace/components/workspace-sidebar";
import type { Role } from "@/lib/research-types";

type WorkspaceShellProps = {
  avatarUrl: string | null;
  activeItem: string;
  personName: string;
  role: Role;
  systemRole: string;
  availableRoles: Role[];
  projectCount: number;
  children: ReactNode;
};

const sidebarPreference = "research-tracker:sidebar-collapsed";
let inMemoryCollapsed = false;

function readSidebarPreference() {
  try {
    const value = window.localStorage.getItem(sidebarPreference);
    return value === null ? inMemoryCollapsed : value === "true";
  } catch {
    return inMemoryCollapsed;
  }
}

function subscribeToSidebarPreference(onChange: () => void) {
  window.addEventListener(sidebarPreference, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(sidebarPreference, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setSidebarCollapsed(collapsed: boolean) {
  inMemoryCollapsed = collapsed;
  try {
    window.localStorage.setItem(sidebarPreference, String(collapsed));
  } catch {
    // Keep the preference in memory when storage is unavailable.
  }
  window.dispatchEvent(new Event(sidebarPreference));
}

export default function WorkspaceShell({
  avatarUrl,
  activeItem,
  personName,
  role,
  systemRole,
  availableRoles,
  projectCount,
  children,
}: WorkspaceShellProps) {
  const router = useRouter();
  const sidebarCollapsed = useSyncExternalStore(subscribeToSidebarPreference, readSidebarPreference, () => false);
  const sidebarOffset = sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[248px]";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const isManager = systemRole === "PM" || systemRole === "SUPERADMIN";

  const changeMode = async (nextRole: Role) => {
    if (nextRole === role || savingMode || refreshing) return;
    setSavingMode(true);
    try {
      const response = await workspaceFetch("/api/profile/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextRole === "Advisor" ? "ADVISOR" : "ADVISEE" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "เปลี่ยนโหมดไม่สำเร็จ");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เปลี่ยนโหมดไม่สำเร็จ");
    } finally {
      setSavingMode(false);
    }
  };

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { authClient } = await import("@/lib/auth-client");
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message);
      router.replace("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
      toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  };

  return (
    <div className="min-h-svh bg-[#f6f4f0] text-foreground">
      <a href="#workspace-main" className="sr-only rounded-lg bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">ข้ามไปยังเนื้อหา</a>
      <WorkspaceSidebar
        activeItem={activeItem}
        systemRole={systemRole}
        isManager={isManager}
        projectCount={projectCount}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <header className={`sticky top-0 z-30 border-b border-[#e7e0d9] bg-[#fffcf8]/95 px-3 backdrop-blur motion-safe:transition-[margin] motion-safe:duration-200 sm:px-6 lg:px-8 ${sidebarOffset}`}>
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="เปิดเมนูพื้นที่ทำงาน"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              aria-controls="workspace-mobile-sidebar"
              className="size-10 shrink-0 border border-[#e7e0d9] bg-white text-primary lg:hidden"
            >
              <Menu className="size-[18px]" />
            </Button>
            <nav aria-label="ตำแหน่งปัจจุบัน" className="flex min-w-0 items-center gap-2.5">
              <Link href="/" className="hidden whitespace-nowrap text-base text-[#6e626c] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary sm:inline">พื้นที่ทำงาน</Link>
              <ChevronRight aria-hidden className="hidden size-3.5 shrink-0 text-[#8b7c87] sm:block" />
              <span className="truncate text-lg font-bold leading-none text-[#3d2b44]" aria-current="page">{activeItem}</span>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
            <ProfileMenu name={personName} avatarUrl={avatarUrl} role={roleLabel(role, systemRole)} availableRoles={availableRoles.includes(role) ? availableRoles : undefined} modeBusy={savingMode || refreshing} onModeChange={(mode) => void changeMode(mode)} signingOut={signingOut} onSignOut={() => void signOut()} />
          </div>
        </div>
      </header>

      <main id="workspace-main" tabIndex={-1} className={`scroll-mt-20 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 outline-none motion-safe:transition-[margin] motion-safe:duration-200 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12 ${sidebarOffset}`}>
        <div className="mx-auto max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}

function roleLabel(role: Role, systemRole: string) {
  if (role === "Advisor") return "Advisor";
  if (role === "Advisee") return "Advisee";
  if (systemRole === "SUPERADMIN") return "Superadmin";
  return systemRole === "PM" ? "PM" : "รอกำหนดบทบาท";
}
