import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TABLE_PAGE_SIZE = 10;

export function TablePagination({ page, total, onPageChange }: {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE));
  const firstNumber = Math.max(1, Math.min(page - 2, pages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, pages) }, (_, index) => firstNumber + index);
  const start = total ? (page - 1) * TABLE_PAGE_SIZE + 1 : 0;
  const end = Math.min(page * TABLE_PAGE_SIZE, total);

  return (
    <nav aria-label="เปลี่ยนหน้าตาราง" className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e0d9] bg-[#fbf8f5] px-4 py-3 sm:px-5">
      <p aria-live="polite" className="text-base tabular-nums text-muted-foreground">แสดง {start}–{end} จาก {total} รายการ</p>
      {pages > 1 && (
        <div className="flex max-w-full flex-wrap items-center gap-1">
          <Button type="button" variant="ghost" size="icon" disabled={page <= 1} onClick={() => onPageChange(1)} aria-label="หน้าแรก"><ChevronFirst /></Button>
          <Button type="button" variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="หน้าก่อนหน้า"><ChevronLeft /></Button>
          <span aria-live="polite" className="px-2 text-center text-base tabular-nums sm:hidden">{page} / {pages}</span>
          <div className="hidden items-center gap-1 sm:flex">
            {pageNumbers.map((number) => (
              <Button key={number} type="button" variant={number === page ? "default" : "ghost"} size="icon" aria-current={number === page ? "page" : undefined} aria-label={`หน้า ${number} จาก ${pages}`} onClick={() => onPageChange(number)} className="tabular-nums">{number}</Button>
            ))}
          </div>
          <Button type="button" variant="outline" size="icon" disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="หน้าถัดไป"><ChevronRight /></Button>
          <Button type="button" variant="ghost" size="icon" disabled={page >= pages} onClick={() => onPageChange(pages)} aria-label="หน้าสุดท้าย"><ChevronLast /></Button>
        </div>
      )}
    </nav>
  );
}
