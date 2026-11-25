"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpenCheck,
  ChevronDown,
  FlaskConical,
  LayoutDashboard,
  MessageSquareText,
  Circle,
  CircleDot,
  UserRound,
  UserRoundCog,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Role } from "@/lib/research-types";

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  section: "workspace" | "management";
  managerOnly?: boolean;
  pmOnly?: boolean;
};

export type WorkspaceSidebarProps = {
  activeItem: string;
  personName: string;
  avatarUrl?: string | null;
  role: Role;
  systemRole: string;
  availableRoles: Role[];
  isManager: boolean;
  projectCount: number;
  commentCount: number;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onNavigate: (label: string) => void;
  onModeChange: (role: Role) => Promise<void>;
};

const items: SidebarItem[] = [
  { label: "ภาพรวม", icon: LayoutDashboard, section: "workspace" },
  { label: "งานวิจัย", icon: FlaskConical, section: "workspace" },
  { label: "ความเห็น", icon: MessageSquareText, section: "workspace" },
  { label: "ทีม", icon: UsersRound, section: "workspace" },
  { label: "จัดการผู้ใช้", icon: UserRoundCog, section: "management", managerOnly: true },
  { label: "สรุปที่ปรึกษาหลัก", icon: UsersRound, section: "management", managerOnly: true, pmOnly: true },
];

export default function WorkspaceSidebar(props: WorkspaceSidebarProps) {
  const [preview, setPreview] = useState(false);
  const expanded = !props.collapsed || preview;
  const visibleItems = items.filter((item) => (!item.managerOnly || props.isManager) && (!item.pmOnly || props.systemRole === "PM"));
  const mobileItems = visibleItems.filter((item) => !item.managerOnly);

  return (
    <>
      <aside
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" && props.collapsed) setPreview(true);
        }}
        onPointerLeave={() => setPreview(false)}
        onFocusCapture={(event) => {
          if (props.collapsed && event.target.matches(":focus-visible")) setPreview(true);
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPreview(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && preview) setPreview(false);
        }}
        className={`fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-[#e9e1ee] bg-white motion-safe:transition-[width,box-shadow] motion-safe:duration-200 lg:flex ${expanded ? "w-[272px]" : "w-[88px]"} ${props.collapsed && preview ? "shadow-[16px_0_48px_-18px_rgba(50,28,68,.3)]" : ""}`}
      >
        <SidebarPanel
          {...props}
          compact={!expanded}
          items={visibleItems}
          onCollapsedChange={(collapsed) => {
            setPreview(false);
            props.onCollapsedChange(collapsed);
          }}
        />
      </aside>

      <Dialog open={props.mobileOpen} onOpenChange={props.onMobileOpenChange}>
        <DialogContent
          id="workspace-mobile-sidebar"
          showCloseButton={false}
          className="fixed inset-y-0 left-0 top-0 flex h-[100svh] w-[min(19rem,calc(100%-1rem))] !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-[0_16px_48px_rgba(37,29,48,.16)] sm:max-w-[304px] sm:rounded-r-2xl lg:hidden"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>เมนูพื้นที่ทำงาน</DialogTitle>
            <DialogDescription>เลือกหน้าที่ต้องการ หรือเปลี่ยนโหมดการทำงาน</DialogDescription>
          </DialogHeader>
          <DialogClose aria-label="ปิดเมนู" className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-xl bg-white text-[#756c80] ring-1 ring-[#e9e7ed] transition hover:bg-[#f7f6f9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#765196]/15">
            <X className="size-4" />
            <span className="sr-only">ปิดเมนู</span>
          </DialogClose>
          <SidebarPanel {...props} items={visibleItems} mobile />
        </DialogContent>
      </Dialog>

      <nav
        aria-label="เมนูลัด"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#e9e7ed] bg-white px-1 pb-[max(env(safe-area-inset-bottom),.4rem)] pt-1.5 lg:hidden"
      >
        {mobileItems.map((item) => (
          <BottomNavItem
            key={item.label}
            item={item}
            active={props.activeItem === item.label}
            onClick={() => props.onNavigate(item.label)}
          />
        ))}
        <BottomProfileItem personName={props.personName} active={props.activeItem === "โปรไฟล์"} />
      </nav>
    </>
  );
}

type SidebarPanelProps = Omit<WorkspaceSidebarProps, "commentCount"> & {
  items: SidebarItem[];
  commentCount: number;
  mobile?: boolean;
  compact?: boolean;
};

function SidebarPanel({
  activeItem,
  personName,
  avatarUrl,
  role,
  systemRole,
  availableRoles,
  isManager,
  projectCount,
  collapsed,
  onCollapsedChange,
  items: menuItems,
  commentCount,
  mobile = false,
  compact = false,
  onMobileOpenChange,
  onNavigate,
  onModeChange,
}: SidebarPanelProps) {
  const isCollapsed = !mobile && compact;
  const workspaceItems = menuItems.filter((item) => item.section === "workspace");
  const managementItems = menuItems.filter((item) => item.section === "management");
  const currentRole = roleLabel(role, systemRole);
  const navigate = (label: string) => {
    onNavigate(label);
    if (mobile) onMobileOpenChange(false);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-linear-to-b from-[#fcf9fe] via-white to-white">
      <div className={`flex min-h-[76px] shrink-0 items-center border-b border-[#eee7f1] ${isCollapsed ? "justify-center px-2" : "justify-between gap-2 px-5 pr-14 lg:px-4"}`}>
        <Link href="/" onClick={() => mobile && onMobileOpenChange(false)} className="inline-flex min-w-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#765196]/15" aria-label="Research Tracker หน้าแรก" title={isCollapsed ? "Research Tracker" : undefined}>
          {isCollapsed ? (
            <Image src="/images/branding/icon.png" alt="" width={40} height={40} className="size-8 shrink-0 object-contain" />
          ) : (
            <Image src="/images/branding/logo-horizontal.png.png" alt="Research Tracker" width={434} height={145} priority className="h-auto w-[158px] object-contain" />
          )}
        </Link>
        {!mobile && !isCollapsed && (
          <button
            type="button"
            aria-label="ตรึง Sidebar"
            aria-pressed={!collapsed}
            title={collapsed ? "ตรึง Sidebar ให้เปิดค้าง" : "เลิกตรึง Sidebar"}
            onClick={(event) => {
              if (!collapsed && event.detail === 0) {
                event.currentTarget.closest("aside")?.querySelector("a")?.focus();
              }
              onCollapsedChange(!collapsed);
            }}
            className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${collapsed ? "text-muted-foreground hover:bg-secondary hover:text-primary" : "bg-secondary text-primary hover:bg-primary/10"}`}
          >
            {collapsed ? <Circle aria-hidden className="size-[18px]" /> : <CircleDot aria-hidden className="size-[18px]" />}
          </button>
        )}
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto py-5 ${isCollapsed ? "px-2" : "px-3"}`}>
        {!isCollapsed ? (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[#eee5f3] bg-[#f8f3fb] px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#756d80]"><FlaskConical className="size-4 shrink-0 text-[#765196]" /><span className="truncate">โครงการในมุมมองนี้</span></span>
            <span className="ml-2 text-sm font-semibold tabular-nums text-[#473954]">{projectCount}</span>
          </div>
        ) : (
          <div className="mb-6 flex justify-center" title={`โครงการในมุมมองนี้ ${projectCount} รายการ`}><span className="grid size-10 place-items-center rounded-xl bg-[#f4f0f7] text-[#694786]"><FlaskConical className="size-[18px]" /></span></div>
        )}

        <nav aria-label="เมนูหลัก" className="space-y-6">
          <SidebarGroup collapsed={isCollapsed} title="พื้นที่ทำงาน" items={workspaceItems} activeItem={activeItem} commentCount={commentCount} onNavigate={navigate} />
          {isManager && managementItems.length > 0 && <SidebarGroup collapsed={isCollapsed} title="จัดการระบบ" items={managementItems} activeItem={activeItem} commentCount={commentCount} onNavigate={navigate} />}
        </nav>

        {availableRoles.length > 1 && availableRoles.includes(role) && (
          <label className={`relative mt-7 block ${isCollapsed ? "mx-auto grid size-10 place-items-center" : ""}`} title={isCollapsed ? `โหมดการทำงาน: ${currentRole}` : undefined}>
            {!isCollapsed && <span className="mb-2 block px-2 text-xs font-medium text-[#898291]">โหมดการทำงาน</span>}
            <span className={`relative flex items-center ${isCollapsed ? "size-full justify-center" : "h-10"}`}>
              <BookOpenCheck className={`pointer-events-none absolute size-4 text-[#765196] ${isCollapsed ? "" : "left-3"}`} />
              <select value={role} aria-label="เลือกโหมดการทำงาน" onChange={(event) => { onMobileOpenChange(false); void onModeChange(event.target.value as Role); }} className={isCollapsed ? "absolute inset-0 h-full w-full cursor-pointer opacity-0" : "h-10 w-full appearance-none rounded-lg border border-[#e7e4eb] bg-white pl-9 pr-8 text-sm font-medium text-[#51475b] outline-none transition hover:border-[#d5c9df] focus-visible:ring-4 focus-visible:ring-[#765196]/15"}>
                {availableRoles.map((availableRole) => <option key={availableRole} value={availableRole}>{modeLabel(availableRole)}</option>)}
              </select>
              {!isCollapsed && <ChevronDown className="pointer-events-none absolute right-3 size-4 text-[#958e9d]" />}
            </span>
          </label>
        )}
      </div>

      <div className={`border-t border-[#efedf2] bg-white ${isCollapsed ? "p-2" : "p-3"}`}>
        <Link href="/profile" onClick={() => mobile && onMobileOpenChange(false)} aria-label={`โปรไฟล์ของฉัน · ${personName}`} title={isCollapsed ? `โปรไฟล์ · ${personName}` : undefined} className={`group flex min-h-14 items-center gap-3 rounded-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#765196]/15 ${isCollapsed ? "justify-center px-1" : "px-2.5 py-2 hover:bg-[#f7f6f9]"}`}>
          <Avatar aria-hidden className="size-9 ring-1 ring-[#e6dfec]">
            <AvatarImage src={avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="bg-[#f0ebf5] text-xs font-semibold text-[#62417d]">{initials(personName)}</AvatarFallback>
          </Avatar>
          {!isCollapsed && <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#44394e]">{personName}</span><span className="mt-0.5 block truncate text-xs text-[#847c8c]">{currentRole}</span></span>}
          {isCollapsed && <span className="sr-only">โปรไฟล์ของฉัน</span>}
          {!isCollapsed && <UserRound className="size-4 shrink-0 text-[#92899a] transition group-hover:text-[#674582]" />}
        </Link>
      </div>
    </div>
  );
}

function SidebarGroup({ title, items: menuItems, activeItem, commentCount, onNavigate, collapsed }: {
  title: string;
  items: SidebarItem[];
  activeItem: string;
  commentCount: number;
  onNavigate: (label: string) => void;
  collapsed: boolean;
}) {
  return (
    <div>
      {!collapsed && <p className="mb-2 px-2 text-[11px] font-semibold text-[#9a94a2]">{title}</p>}
      <div className="space-y-1">
        {menuItems.map((item) => <SidebarNavItem key={item.label} item={item} active={activeItem === item.label} count={item.label === "ความเห็น" ? commentCount : undefined} collapsed={collapsed} onClick={() => onNavigate(item.label)} />)}
      </div>
    </div>
  );
}

function SidebarNavItem({ item, active, count, onClick, collapsed }: {
  item: SidebarItem;
  active: boolean;
  count?: number;
  onClick: () => void;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined} className={`group relative flex min-h-10 w-full items-center gap-3 rounded-lg text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#765196]/15 ${collapsed ? "justify-center px-2" : "px-2.5"} ${active ? "bg-[#f1edf5] font-semibold text-[#583b73]" : "font-medium text-[#716a7a] hover:bg-[#f7f6f9] hover:text-[#453951]"}`}>
      <span className="relative grid size-8 shrink-0 place-items-center"><Icon className={`size-[18px] ${active ? "text-[#684685]" : "text-[#8b8494] group-hover:text-[#674582]"}`} strokeWidth={active ? 2 : 1.8} />{collapsed && count !== undefined && count > 0 && <span className="absolute right-0 top-0 size-1.5 rounded-full bg-[#739748] ring-2 ring-white" />}</span>
      <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>{item.label}</span>
      {!collapsed && count !== undefined && count > 0 && <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums ${active ? "bg-white text-[#63427e]" : "bg-[#f0eef3] text-[#7a7383]"}`}>{count > 99 ? "99+" : count}</span>}
      {active && !collapsed && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-[#684685]" />}
    </button>
  );
}

function BottomNavItem({ item, active, onClick }: { item: SidebarItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#765196]/15 ${active ? "text-[#60417b]" : "text-[#807989] hover:bg-[#f8f7fa]"}`}>
      <Icon className={`size-[18px] ${active ? "text-[#60417b]" : "text-[#898290]"}`} strokeWidth={active ? 2 : 1.8} />
      <span>{item.label}</span>
    </button>
  );
}

function BottomProfileItem({ personName, active }: { personName: string; active: boolean }) {
  return (
    <Link href="/profile" aria-current={active ? "page" : undefined} aria-label={`เปิดโปรไฟล์ของ ${personName}`} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#765196]/15 ${active ? "text-[#60417b]" : "text-[#807989] hover:bg-[#f8f7fa]"}`}>
      <UserRound className={`size-[18px] ${active ? "text-[#60417b]" : "text-[#898290]"}`} strokeWidth={active ? 2 : 1.8} />
      <span>โปรไฟล์</span>
    </Link>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") || "RT";
}

function modeLabel(role: Role) {
  return role === "Advisor" ? "Advisor · ที่ปรึกษา" : "Advisee · นักวิจัย";
}

function roleLabel(role: Role, systemRole: string) {
  if (role === "Advisor") return "Advisor · ที่ปรึกษา";
  if (role === "Advisee") return "Advisee · นักวิจัย";
  if (systemRole === "SUPERADMIN" || role === "Superadmin") return "Superadmin";
  return "PM · ผู้จัดการโครงการ";
}
