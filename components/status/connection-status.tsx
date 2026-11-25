"use client";

import { Button } from "@/components/ui/button";
import StatusPanel from "./status-panel";
import { useOnlineStatus } from "./workspace-status";

export default function ConnectionStatus({ retry }: { retry: () => void }) {
  const online = useOnlineStatus();
  return (
    <StatusPanel embedded kind={online ? "error" : "offline"}
      title={online ? "เชื่อมต่อระบบไม่สำเร็จ" : "ขาดการเชื่อมต่ออินเทอร์เน็ต"}
      description={online ? "ข้อมูลส่วนนี้ยังโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" : "เชื่อมต่ออินเทอร์เน็ตก่อน แล้วกดลองใหม่เพื่อโหลดข้อมูล"}>
      <Button type="button" disabled={!online} onClick={retry}>ลองใหม่</Button>
    </StatusPanel>
  );
}
