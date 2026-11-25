"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusPanel, { StatusLink } from "./status-panel";
import { useOnlineStatus } from "./workspace-status";

export type ErrorStatusProps = {
  error: Error & { digest?: string };
  retry?: () => void;
  unstable_retry?: () => void;
  reset?: () => void;
};

export default function ErrorStatus({ error, retry, unstable_retry, reset }: ErrorStatusProps) {
  const online = useOnlineStatus();
  return <StatusPanel kind={online ? "error" : "offline"} code={online ? "500" : undefined}
    title={online ? "เกิดข้อผิดพลาดของระบบ" : "ขาดการเชื่อมต่ออินเทอร์เน็ต"}
    description={online ? "หน้านี้โหลดไม่สำเร็จ ลองเปิดใหม่อีกครั้ง หรือกลับไปที่หน้าหลัก" : "เชื่อมต่ออินเทอร์เน็ตอีกครั้ง แล้วกดลองใหม่"}
    reference={online ? error.digest : undefined}>
    <Button type="button" disabled={!online} onClick={() => {
      const recover = retry ?? unstable_retry ?? reset;
      if (recover) recover();
      else window.location.reload();
    }}><RotateCw aria-hidden /> ลองใหม่</Button>
    <StatusLink href="/" secondary>กลับหน้าหลัก</StatusLink>
  </StatusPanel>;
}
