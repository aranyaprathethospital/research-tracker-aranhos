"use client";

import { workspaceFetch } from "@/lib/workspace-fetch";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import ProfileMenu from "@/features/workspace/components/profile-menu";
import { NotificationBell } from "./notifications";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import WorkspaceSidebar from "@/features/workspace/components/workspace-sidebar";
import { workspaceHref } from "@/features/workspace/navigation";
import type { Role } from "@/lib/research-types";

type WorkspaceShellProps = {
  avatarUrl: string | null;
  activeItem: string;
  personName: string;
  role: Role;
  systemRole: string;
  availableRoles: Role[];
  projectCount: number;
  commentCount: number;
  onNavigate?: (label: string) => void;
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
  commentCount,
  onNavigate,
  children,
}: WorkspaceShellProps) {
  const router = useRouter();
  const sidebarCollapsed = useSyncExternalStore(subscribeToSidebarPreference, readSidebarPreference, () => false);
  const sidebarOffset = sidebarCollapsed ? "lg:ml-[88px]" : "lg:ml-[272px]";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isManager = systemRole === "PM" || systemRole === "SUPERADMIN" || role === "PM" || role === "Superadmin";

  const navigate = (label: string) => {
    setMobileOpen(false);
    if (label === "สรุปที่ปรึกษาหลัก") {
      router.push("/advisors");
      return;
    }
    if (onNavigate) {
      onNavigate(label);
      return;
    }
    if (label === "จัดการผู้ใช้") {
      router.push("/users");
      return;
    }
    router.push(workspaceHref(label));
  };

  const changeMode = async (nextRole: Role) => {
    try {
      const response = await workspaceFetch("/api/profile/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextRole === "Advisor" ? "ADVISOR" : "ADVISEE" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "เปลี่ยนโหมดไม่สำเร็จ");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เปลี่ยนโหมดไม่สำเร็จ");
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
    <div className="min-h-[100svh] bg-[#f7f7fa] text-[#302a38]">
      <WorkspaceSidebar
        avatarUrl={avatarUrl}
        activeItem={activeItem}
        personName={personName}
        role={role}
        systemRole={systemRole}
        availableRoles={availableRoles}
        isManager={isManager}
        projectCount={projectCount}
        commentCount={commentCount}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        onNavigate={navigate}
        onModeChange={changeMode}
      />

      <header className={`sticky top-0 z-30 border-b border-[#e9e7ed] bg-white/95 px-3 backdrop-blur motion-safe:transition-[margin] motion-safe:duration-200 sm:px-6 lg:px-8 ${sidebarOffset}`}>
        <div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center justify-between gap-3">
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
              className="size-10 shrink-0 rounded-lg text-[#655d6d] lg:hidden"
            >
              <Menu className="size-[18px]" />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-[#96909d] sm:text-xs">Research Tracker <span className="mx-1 text-[#c7c3cd]">/</span> พื้นที่ทำงาน</p>
              <h1 className="truncate text-sm font-semibold text-[#403748] sm:text-base">{activeItem}</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
            <ProfileMenu name={personName} avatarUrl={avatarUrl} role={roleLabel(role, systemRole)} signingOut={signingOut} onSignOut={() => void signOut()} />
          </div>
        </div>
      </header>

      <main id="top" className={`px-4 pb-24 pt-6 motion-safe:transition-[margin] motion-safe:duration-200 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8 ${sidebarOffset}`}>
        <div className="mx-auto max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}

function roleLabel(role: Role, systemRole: string) {
  if (role === "Advisor") return "Advisor";
  if (role === "Advisee") return "Advisee";
  if (role === "Superadmin" || systemRole === "SUPERADMIN") return "Superadmin";
  return "PM";
}
