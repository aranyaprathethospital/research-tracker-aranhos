import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TABLE_PAGE_SIZE = 10;

export function TablePagination({ page, total, onPageChange }: {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE));
  const start = total ? (page - 1) * TABLE_PAGE_SIZE + 1 : 0;
  const end = Math.min(page * TABLE_PAGE_SIZE, total);

  return (
    <nav aria-label="เปลี่ยนหน้าตาราง" className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e0d9] bg-[#fbf8f5] px-4 py-3 sm:px-5">
      <p aria-live="polite" className="text-base tabular-nums text-muted-foreground">แสดง {start}–{end} จาก {total} รายการ</p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="หน้าก่อนหน้า"><ChevronLeft /></Button>
          <span className="min-w-12 text-center text-sm tabular-nums">{page} / {pages}</span>
          <Button type="button" variant="outline" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="หน้าถัดไป"><ChevronRight /></Button>
        </div>
      )}
    </nav>
  );
}
