"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BookOpenCheck, FlaskConical, LayoutDashboard, MessageSquareText, PanelLeftClose, PanelLeftOpen, UserRoundCog, UsersRound, X, type LucideIcon } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { workspaceHref } from "@/features/workspace/navigation";

const workspaceItems = [
  { label: "ภาพรวม", icon: LayoutDashboard },
  { label: "งานวิจัย", icon: FlaskConical },
  { label: "ความเห็น", icon: MessageSquareText },
  { label: "ทีม", icon: UsersRound },
] as const;

const userManagement = { label: "จัดการผู้ใช้", icon: UserRoundCog };
const advisorManagement = { label: "สรุปที่ปรึกษาหลัก", icon: BookOpenCheck };

type SidebarItem = { label: string; icon: LucideIcon };

type WorkspaceSidebarProps = {
  activeItem: string;
  systemRole: string;
  isManager: boolean;
  projectCount: number;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

export default function WorkspaceSidebar(props: WorkspaceSidebarProps) {
  const [preview, setPreview] = useState(false);
  const compact = props.collapsed && !preview;

  return (
    <>
      <aside
        onPointerEnter={(event) => { if (event.pointerType === "mouse" && props.collapsed) setPreview(true); }}
        onPointerLeave={() => setPreview(false)}
        onFocusCapture={(event) => { if (props.collapsed && event.target.matches(":focus-visible")) setPreview(true); }}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPreview(false); }}
        onKeyDown={(event) => { if (event.key === "Escape") setPreview(false); }}
        className={`fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-[#e7e0d9] bg-[#fffcf8] motion-safe:transition-[width,box-shadow] motion-safe:duration-200 lg:flex ${compact ? "w-[76px]" : "w-[248px]"} ${props.collapsed && preview ? "shadow-[16px_0_36px_-18px_#2d1c3b55]" : ""}`}
      >
        <SidebarPanel {...props} compact={compact} onCollapsedChange={(collapsed) => { setPreview(false); props.onCollapsedChange(collapsed); }} />
      </aside>

      <Dialog open={props.mobileOpen} onOpenChange={props.onMobileOpenChange}>
        <DialogContent id="workspace-mobile-sidebar" showCloseButton={false} className="fixed inset-y-0 left-0 top-0 flex h-svh w-[min(20rem,calc(100%-1.5rem))] !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-xs lg:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>เมนูพื้นที่ทำงาน</DialogTitle>
            <DialogDescription>เลือกหน้าที่ต้องการเปิด</DialogDescription>
          </DialogHeader>
          <DialogClose aria-label="ปิดเมนู" render={<Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10" />}><X aria-hidden /></DialogClose>
          <SidebarPanel {...props} mobile />
        </DialogContent>
      </Dialog>

      <nav aria-label="เมนูลัด" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-[#e7e0d9] bg-[#fffcf8] px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),.4rem)] lg:hidden">
        {workspaceItems.map(({ label, icon: Icon }) => {
          const active = props.activeItem === label;
          return (
            <Link key={label} href={workspaceHref(label)} aria-current={active ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-sm font-bold leading-none focus-visible:outline-2 focus-visible:outline-primary ${active ? "bg-[#efe7f3] text-[#56366b]" : "text-[#6d636d] hover:bg-[#f3ede8]"}`}>
              <Icon aria-hidden className="size-[17px]" strokeWidth={active ? 2 : 1.65} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SidebarPanel({ activeItem, isManager, systemRole, projectCount, collapsed, onCollapsedChange, onMobileOpenChange, compact = false, mobile = false }: WorkspaceSidebarProps & { compact?: boolean; mobile?: boolean }) {
  const closeMobile = mobile ? () => onMobileOpenChange(false) : undefined;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#fffcf8]">
      <div className={`flex min-h-16 shrink-0 items-center border-b border-[#e7e0d9] ${compact ? "flex-col justify-center gap-1 py-2" : "justify-between gap-2 px-4 pr-14 lg:pr-3"}`}>
        <Link href="/" onNavigate={closeMobile} aria-label="Research Tracker หน้าแรก" className="inline-flex min-w-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
          {compact
            ? <Image src="/favicons/android-chrome-192x192.png" alt="" width={34} height={34} className="size-[34px] shrink-0 object-contain" />
            : <Image src="/images/branding/logo-horizontal.png.png" alt="" width={160} height={52} sizes="160px" className="h-auto w-40 object-contain" />}
        </Link>
        {!mobile && <SidebarToggle collapsed={collapsed} onClick={() => onCollapsedChange(!collapsed)} />}
      </div>
      <div className={`min-h-0 flex-1 overflow-y-auto py-5 ${compact ? "px-2.5" : "px-3.5"}`}>
        <nav aria-label="เมนูหลัก" className="space-y-5">
          <div className="space-y-1">
            {!compact && <p className="px-3 pb-1 text-sm font-bold text-[#786879]">พื้นที่ทำงาน</p>}
            {workspaceItems.map((item) => <SidebarNavItem key={item.label} item={item} active={activeItem === item.label} compact={compact} count={item.label === "งานวิจัย" ? projectCount : undefined} onNavigate={closeMobile} />)}
            {systemRole === "PM" && <SidebarNavItem item={advisorManagement} active={activeItem === advisorManagement.label} compact={compact} onNavigate={closeMobile} />}
          </div>
          {isManager && <div className="space-y-1 border-t border-[#e7e0d9] pt-4">
            {!compact && <p className="px-3 pb-1 text-sm font-bold text-[#786879]">จัดการระบบ</p>}
            <SidebarNavItem item={userManagement} active={activeItem === userManagement.label} compact={compact} onNavigate={closeMobile} />
          </div>}
        </nav>
      </div>
    </div>
  );
}

function SidebarToggle({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  const label = collapsed ? "ตรึงแถบเมนูให้เปิดค้าง" : "ย่อแถบเมนู";
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return <Button type="button" variant="ghost" size="icon" aria-label={label} title={label} onClick={onClick} className="size-9 text-[#796883]"><Icon aria-hidden /></Button>;
}

function SidebarNavItem({ item, active, count, compact, onNavigate }: { item: SidebarItem; active: boolean; count?: number; compact: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={workspaceHref(item.label)} onNavigate={onNavigate} aria-current={active ? "page" : undefined} aria-label={compact ? item.label : undefined} title={compact ? item.label : undefined}
      className={`relative flex min-h-11 items-center gap-3 rounded-lg text-base leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${compact ? "justify-center" : "px-3"} ${active ? "bg-[#eee5f1] font-bold text-[#503160]" : "text-[#695d68] hover:bg-[#f3ede8] hover:text-[#503160]"}`}>
      {active && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#78588a]" />}
      <Icon aria-hidden className="size-[18px] shrink-0" strokeWidth={active ? 2 : 1.65} />
      {!compact && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {!compact && Boolean(count) && count !== undefined && <span className="text-sm font-bold tabular-nums text-[#786879]">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
