import { Suspense } from "react";
import Dashboard from "../dashboard";

export default function DemoPage() {
  return <Suspense fallback={<main className="loading-screen">กำลังโหลดโหมดตัวอย่าง…</main>}><Dashboard demo /></Suspense>;
}
