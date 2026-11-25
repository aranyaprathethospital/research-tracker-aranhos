import type { ReactNode } from "react";
import Image from "next/image";
import { stages, titleRoundLabel, type Research } from "@/lib/research-types";
import { reviewLabels } from "./project-display";
import ProjectReportActions from "./project-report-actions";

const dates = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { dateStyle: "long", timeZone: "Asia/Bangkok" });
const timestamps = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  dateStyle: "medium", timeStyle: "short", hourCycle: "h23", timeZone: "Asia/Bangkok",
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-6 border-t border-[#e5ddea] pt-3">
    <h2 className="mb-2 break-after-avoid text-xl font-bold text-[#432c56]">{title}</h2>
    {children}
  </section>;
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return <div>
    <h3 className="break-after-avoid font-bold">{label}</h3>
    <p className="whitespace-pre-wrap wrap-break-word">{value.trim() || "ยังไม่ระบุ"}</p>
  </div>;
}

export default function ProjectReport({ project, code }: { project: Research; code: string }) {
  return (
    <main className="min-h-svh bg-[#f7f3f9] px-3 py-5 sm:px-6 print:min-h-0 print:bg-white print:p-0">
      <ProjectReportActions projectId={project.id} />
      <article className="mx-auto w-full max-w-[210mm] rounded-2xl border border-border bg-white p-5 text-lg leading-snug text-[#29232e] shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:text-[12pt] print:shadow-none">
        <header className="break-inside-avoid border-b-2 border-[#745491] pb-4">
          <Image src="/images/branding/logo-horizontal.png.png" width={240} height={80} alt="Research Tracker" loading="eager" data-report-logo className="mb-3 h-auto w-44" />
          <p className="font-bold text-[#654681]">รายงานความก้าวหน้างานวิจัย · {code}</p>
          <h1 className="mt-1 wrap-break-word text-3xl font-bold leading-tight print:text-[19pt]">{project.title}</h1>
          <p className="mt-2">ชื่อเรื่อง{titleRoundLabel(project.titleVersion)} · อัปเดตล่าสุด <time dateTime={project.updatedAt}>{timestamps.format(new Date(project.updatedAt))} น.</time></p>
        </header>

        <Section title="ผู้วิจัยและที่ปรึกษา">
          <dl className="grid gap-2 sm:grid-cols-2 print:grid-cols-2">
            <div><dt className="font-bold">ผู้วิจัย</dt><dd className="wrap-break-word">{project.student}</dd></div>
            <div><dt className="font-bold">ที่ปรึกษาหลัก</dt><dd className="wrap-break-word">{project.primaryAdvisor || "ยังไม่ระบุ"}</dd></div>
            <div className="sm:col-span-2 print:col-span-2"><dt className="font-bold">ที่ปรึกษารอง</dt><dd className="wrap-break-word">{project.secondaryAdvisors?.join(", ") || "ยังไม่ระบุ"}</dd></div>
          </dl>
        </Section>

        <Section title="ความคืบหน้าและกำหนดส่ง">
          <dl className="grid gap-2 sm:grid-cols-3 print:grid-cols-3">
            <div><dt className="font-bold">ขั้นตอนปัจจุบัน</dt><dd>{stages[project.stage] ?? "ยังไม่ระบุ"}</dd></div>
            <div><dt className="font-bold">ความคืบหน้า</dt><dd className="tabular-nums">{project.progress}%</dd></div>
            <div><dt className="font-bold">กำหนดส่ง</dt><dd>{project.dueDate ? <time dateTime={project.dueDate}>{dates.format(new Date(`${project.dueDate}T12:00:00Z`))}</time> : "ยังไม่ระบุ"}</dd></div>
          </dl>
        </Section>

        <Section title="ผลการดำเนินงาน">
          <div className="space-y-2">
            <TextBlock label="ผลการดำเนินงานปัจจุบัน" value={project.nextTask} />
            <TextBlock label="ปัญหาหรือสิ่งที่ติดขัด" value={project.issue} />
            <TextBlock label="หมายเหตุ" value={project.notes} />
          </div>
        </Section>

        <Section title="ผลตรวจและความเห็น">
          {project.advisorReviews?.length ? <ul className="space-y-1">
            {project.advisorReviews.map((review) => <li key={review.id} className="wrap-break-word">{review.advisor} ({review.assignment === "PRIMARY" ? "หลัก" : "รอง"}) · {reviewLabels[review.status] ?? "ยังไม่ระบุ"}</li>)}
          </ul> : <p>ยังไม่ระบุผลตรวจ</p>}
          <h3 className="mt-3 break-after-avoid font-bold">ความเห็นของที่ปรึกษา</h3>
          {project.comments.length ? <ol className="divide-y divide-border">
            {project.comments.map((entry, index) => (
              <li key={`${entry.date}-${index}`} className="py-2">
                <p className="break-after-avoid wrap-break-word font-semibold">{entry.by} · <time dateTime={entry.date}>{timestamps.format(new Date(entry.date))} น.</time></p>
                <p className="whitespace-pre-wrap wrap-break-word">{entry.text}</p>
              </li>
            ))}
          </ol> : <p>ยังไม่มีความเห็น</p>}
        </Section>

        <Section title="ประวัติชื่อเรื่อง">
          <ol className="divide-y divide-border">
            {project.titleHistory.map((entry) => (
              <li key={entry.version} className="py-2">
                <p className="wrap-break-word font-bold">{titleRoundLabel(entry.version)} · {entry.title}</p>
                <p>{entry.author ?? "ไม่ทราบผู้บันทึก"} · {entry.createdAt ? <time dateTime={entry.createdAt}>{timestamps.format(new Date(entry.createdAt))} น.</time> : "ไม่ทราบวันเวลา"}</p>
              </li>
            ))}
          </ol>
          {!project.titleHistory.length && <p>ยังไม่มีประวัติชื่อเรื่อง</p>}
        </Section>
      </article>
    </main>
  );
}
