"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectReportActions({ projectId }: { projectId: string }) {
  const [preparing, setPreparing] = useState(false);

  async function printReport() {
    setPreparing(true);
    try {
      await document.fonts.ready;
      const logo = document.querySelector<HTMLImageElement>("[data-report-logo]");
      if (logo) await logo.decode().catch(() => {});
      window.print();
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
      <Link href={`/projects?project=${encodeURIComponent(projectId)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary">
        <ArrowLeft aria-hidden className="size-4" /> กลับรายละเอียดโครงการ
      </Link>
      <Button type="button" disabled={preparing} onClick={() => void printReport()}>
        <Printer aria-hidden /> {preparing ? "กำลังเตรียมเอกสาร…" : "พิมพ์ / บันทึก PDF"}
      </Button>
      <p className="w-full px-3 text-sm text-muted-foreground">เลือกกระดาษ A4 และปลายทาง «บันทึกเป็น PDF» ในหน้าต่างพิมพ์</p>
    </div>
  );
}
