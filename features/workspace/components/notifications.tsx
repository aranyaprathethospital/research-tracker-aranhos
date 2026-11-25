"use client";

import { workspaceFetch } from "@/lib/workspace-fetch";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { Bell, ChevronRight, MessageCircle, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Notice = {
  id: string;
  projectId: string | null;
  projectTitle: string;
  kind: string;
  message: string;
  createdAt: string;
  readAt: string | null;
};
type Feed = { items: Notice[]; unread: number; hasMore: boolean };
const changed = "research-notifications-changed";
const timestamp = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  dateStyle: "medium", timeStyle: "short", hourCycle: "h23", timeZone: "Asia/Bangkok",
});

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let request: AbortController | undefined;
    const check = () => {
      if (document.hidden) return;
      request?.abort();
      request = new AbortController();
      const { signal } = request;
      void workspaceFetch("/api/notifications?count=1", { cache: "no-store", signal })
        .then(async (response) => {
          if (!response.ok) return;
          const data = await response.json();
          if (!signal.aborted) setUnread(data.unread);
        }).catch(() => {});
    };
    check();
    const timer = window.setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.addEventListener(changed, check);
    return () => {
      request?.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.removeEventListener(changed, check);
    };
  }, []);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger aria-label={unread ? `การแจ้งเตือน ยังไม่อ่าน ${unread} รายการ` : "การแจ้งเตือน"}
        className="relative grid size-11 place-items-center rounded-lg border border-[#e7e0d9] bg-white text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary">
        <Bell aria-hidden className="size-5" />
        {unread > 0 && <span aria-hidden className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={10} align="end" collisionPadding={12} className="z-50">
          <Popover.Popup className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
            {open && <NotificationFeed compact onNavigate={() => setOpen(false)} onUnread={setUnread} />}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function NotificationFeed({ compact = false, onNavigate, onUnread }: {
  compact?: boolean;
  onNavigate?: () => void;
  onUnread?: (count: number) => void;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    void workspaceFetch(`/api/notifications?page=${page}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data: Feed = await response.json();
        if (controller.signal.aborted) return;
        setFeed(data);
        setError(false);
        onUnread?.(data.unread);
      }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [page, revision, onUnread]);

  async function mark(notice?: Notice) {
    if (busy) return;
    setBusy(true);
    try {
      if (!notice || !notice.readAt) {
        const response = await workspaceFetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notice ? { action: "read", id: notice.id } : { action: "read-all" }),
        });
        if (!response.ok) throw new Error();
        window.dispatchEvent(new Event(changed));
        reload();
      }
      if (notice?.projectId) {
        onNavigate?.();
        router.push(`/projects?project=${encodeURIComponent(notice.projectId)}${notice.kind === "review" ? "&focus=review" : ""}`);
      } else if (notice) {
        toast.info("โครงการนี้ไม่พร้อมใช้งาน");
      }
    } catch {
      toast.error("อัปเดตสถานะการแจ้งเตือนไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  const rows = compact ? feed?.items.slice(0, 6) : feed?.items;

  return (
    <section aria-label="รายการแจ้งเตือน" className="overflow-hidden bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-[#e7e0d9] bg-[#fffcf8] px-4 py-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Bell aria-hidden className="size-4 text-primary" /> {compact ? "การแจ้งเตือน" : "กิจกรรมล่าสุด"}</h2>
        <Button size="sm" variant="ghost" disabled={busy || !feed?.unread} onClick={() => void mark()}>อ่านทั้งหมด</Button>
      </div>
      {error ? <div className="p-5 text-center"><p role="alert">เชื่อมต่อระบบแจ้งเตือนไม่สำเร็จ</p><Button variant="ghost" onClick={reload}>ลองอีกครั้ง</Button></div>
        : !rows ? <p role="status" className="p-5 text-center text-muted-foreground">กำลังโหลดการแจ้งเตือน…</p>
        : rows.length === 0 ? <p className="grid justify-items-center gap-2 p-8 text-center text-lg text-muted-foreground"><Bell aria-hidden className="size-6 text-primary" />ยังไม่มีการแจ้งเตือน</p>
        : <ul className={compact ? "max-h-[min(25rem,52svh)] divide-y divide-border overflow-y-auto" : "divide-y divide-border"}>
          {rows.map((notice) => {
            const Icon = notice.kind === "review" ? MessageCircle : UsersRound;
            return <li key={notice.id}>
              <button type="button" disabled={busy} onClick={() => void mark(notice)} className={`flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-[#f7f1f6] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${notice.readAt ? "" : "border-l-2 border-l-primary bg-[#faf5fa]"}`}>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icon aria-hidden className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block wrap-break-word text-lg font-bold leading-tight">{notice.message}</span>
                  <span className="block wrap-break-word text-muted-foreground">{notice.projectTitle}</span>
                  <time className="text-sm text-muted-foreground" dateTime={notice.createdAt}>{timestamp.format(new Date(notice.createdAt))} น.</time>
                  {!notice.readAt && <span className="ml-2 text-sm font-semibold text-primary">ยังไม่อ่าน</span>}
                </span>
                {notice.projectId && <ChevronRight aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />}
              </button>
            </li>;
          })}
        </ul>}
      {compact ? <Link href="/notifications" onClick={onNavigate} className="block border-t border-border px-4 py-3 text-center font-semibold text-primary hover:bg-secondary">ดูการแจ้งเตือนทั้งหมด</Link>
        : feed && (page > 1 || feed.hasMore) && <div className="flex items-center justify-between border-t border-border p-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setFeed(null); setPage(page - 1); }}>ก่อนหน้า</Button>
          <span>หน้า {page}</span>
          <Button variant="outline" size="sm" disabled={!feed.hasMore} onClick={() => { setFeed(null); setPage(page + 1); }}>ถัดไป</Button>
        </div>}
    </section>
  );
}
