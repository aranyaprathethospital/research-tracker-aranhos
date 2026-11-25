"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { WifiOff } from "lucide-react";
import { sessionUnavailableEvent } from "@/lib/workspace-fetch";
import StatusPanel, { StatusLink } from "./status-panel";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

export default function WorkspaceStatus({ children }: { children: ReactNode }) {
  const online = useOnlineStatus();
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const expire = () => setExpired(true);
    window.addEventListener(sessionUnavailableEvent, expire);
    return () => window.removeEventListener(sessionUnavailableEvent, expire);
  }, []);

  if (expired) return <StatusPanel kind="session" code="401" title="ต้องเข้าสู่ระบบอีกครั้ง"
    description="เซสชันนี้ใช้ต่อไม่ได้ กรุณาเข้าสู่ระบบก่อนเปิดหรือบันทึกข้อมูล">
    <StatusLink href="/login">เข้าสู่ระบบ</StatusLink>
  </StatusPanel>;

  return <>
    {children}
    {!online && (
      <div role="status" className="fixed inset-x-3 bottom-24 z-[70] mx-auto flex max-w-md items-start gap-3 rounded-xl border border-[#e8deee] bg-white p-4 shadow-xl lg:bottom-6 print:hidden">
        <WifiOff aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
        <div><p className="font-bold">ขาดการเชื่อมต่ออินเทอร์เน็ต</p><p className="text-sm text-muted-foreground">เปิดการเชื่อมต่ออีกครั้ง แล้วลองทำรายการเดิม</p></div>
      </div>
    )}
  </>;
}
