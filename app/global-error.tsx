"use client";

import "./globals.css";
import { sarabun } from "./fonts";
import ErrorStatus, { type ErrorStatusProps } from "@/components/status/error-status";

export default function GlobalError(props: ErrorStatusProps) {
  return <html lang="th" className={`${sarabun.variable} font-sans`}>
    <body className="bg-[#f7f3fa] text-foreground antialiased">
      <title>เกิดข้อผิดพลาดของระบบ | Research Tracker</title>
      <ErrorStatus {...props} />
    </body>
  </html>;
}
