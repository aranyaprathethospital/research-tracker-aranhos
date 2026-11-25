import StatusPanel, { StatusLink } from "@/components/status/status-panel";

export default function NotFound() {
  return <StatusPanel kind="missing" code="404" title="ไม่พบหน้าที่คุณกำลังหา"
    description="ลิงก์อาจเปลี่ยนไป หรือรายการนี้ไม่พร้อมให้เปิดดูแล้ว">
    <StatusLink href="/">กลับหน้าหลัก</StatusLink>
  </StatusPanel>;
}
