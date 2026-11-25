import { Menu } from "@base-ui/react/menu";
import { ChevronDown, KeyRound, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const itemClass = "flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none data-[highlighted]:bg-[#f2edf6]";

export default function ProfileMenu({ name, avatarUrl, role, signingOut, onSignOut }: {
  name: string;
  avatarUrl: string | null;
  role: string;
  signingOut: boolean;
  onSignOut: () => void;
}) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") || "RT";

  return (
    <Menu.Root>
      <Menu.Trigger aria-label={`เมนูบัญชีของ ${name}`} className="group flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-white p-1.5 pr-2.5 text-left shadow-sm outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-4 focus-visible:ring-ring/20 data-[popup-open]:border-primary/30 data-[popup-open]:bg-secondary/60">
        <Avatar aria-hidden className="size-8">
          <AvatarImage src={avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="bg-primary text-xs font-semibold text-white">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-40 md:block">
          <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
          <span className="block text-xs text-muted-foreground">{role}</span>
        </span>
        <ChevronDown aria-hidden className="size-4 text-muted-foreground motion-safe:transition-transform group-data-[popup-open]:rotate-180" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={10} collisionPadding={12} className="z-50">
          <Menu.Popup className="w-72 max-w-[calc(100vw-1.5rem)] origin-(--transform-origin) overflow-hidden rounded-2xl border border-border bg-white p-1.5 text-foreground shadow-[0_16px_44px_rgba(47,29,62,.16)] outline-none motion-safe:transition-[opacity,scale] motion-safe:duration-150 motion-safe:data-[starting-style]:scale-95 motion-safe:data-[starting-style]:opacity-0 motion-safe:data-[ending-style]:opacity-0">
            <div className="flex items-center gap-3 rounded-xl bg-[#f5f0f8] p-3">
              <Avatar aria-hidden className="size-10 ring-1 ring-primary/10">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="bg-white font-semibold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="wrap-break-word text-sm font-semibold">{name}</p>
                <p className="mt-0.5 text-xs font-medium text-primary">{role}</p>
              </div>
            </div>
            <div className="mt-1.5">
              <Menu.LinkItem render={<Link href="/profile" />} className={itemClass}>
                <UserRound aria-hidden className="size-4 text-primary" /> โปรไฟล์ของฉัน
              </Menu.LinkItem>
              <Menu.LinkItem render={<Link href="/account/password" />} className={itemClass}>
                <KeyRound aria-hidden className="size-4 text-primary" /> เปลี่ยนรหัสผ่าน
              </Menu.LinkItem>
            </div>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Item disabled={signingOut} onClick={onSignOut} className={`${itemClass} text-rose-700 data-[highlighted]:bg-rose-50 data-[disabled]:opacity-60`}>
              <LogOut aria-hidden className="size-4" /> {signingOut ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
