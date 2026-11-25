import { useState } from "react";
import { Check, Clock3, FileDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { canEditResearchTitle, progressFromStage, titleRoundLabel, stages, type Research, type ReviewStatus, type Role } from "@/lib/research-types";
import ProjectTitleHistory from "./project-title-history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SecondaryAdvisorPicker from "./secondary-advisor-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ResearchPersonOption } from "@/features/users/types";
import { reviewLabels, reviews, formatThaiDate, ReviewBadge, Progress } from "./project-display";

const commentTimestamp = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
  hourCycle: "h23",
});
import { fieldClass, textareaClass, Field } from "./project-fields";
import { type ResearchChanges } from "./project-dialog-types";

export function ProjectDialog({ item, focusReview, role, systemRole, person, currentProfileId, onTitleUpdate, people, onClose, onSave }: { focusReview?: boolean; item: Research | null; role: Role; systemRole: string; person: string; currentProfileId: string; onTitleUpdate: (project: Research) => void; people: ResearchPersonOption[]; onClose: () => void; onSave: (id: string, updates: ResearchChanges, description: string) => void }) {
  const [stage, setStage] = useState(item?.stage ?? 0);
  const progress = progressFromStage(stage);
  const [issue, setIssue] = useState(item?.issue ?? "");
  const [nextTask, setNextTask] = useState(item?.nextTask ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [dueDate, setDueDate] = useState(item?.dueDate ?? "");
  const [review, setReview] = useState<ReviewStatus>(item?.myReview ?? item?.review ?? "ยังไม่ส่งตรวจ");
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState<"รายละเอียด" | "ประวัติ">("รายละเอียด");
  const isManager = role === "PM" || role === "Superadmin" || systemRole === "PM" || systemRole === "SUPERADMIN";
  const mayEdit = isManager || role !== "Advisor";
  const mayAssignAdvisors = systemRole === "PM";
  const maySetReview = role === "Advisor" && item?.isMyAdvisor === true;
  const advisorOptions = people.filter((entry) => entry.capabilities.includes("ADVISOR") && entry.active !== false).map((entry) => ({ id: entry.id, name: entry.name }));
  const [primaryAdvisorId, setPrimaryAdvisorId] = useState(advisorOptions.find((entry) => entry.name === item?.primaryAdvisor)?.id ?? advisorOptions.find((entry) => entry.name === item?.advisor[0])?.id ?? "");
  const [secondaryAdvisorIds, setSecondaryAdvisorIds] = useState<string[]>(advisorOptions.filter((entry) => item?.secondaryAdvisors?.includes(entry.name)).map((entry) => entry.id));

  if (!item) return null;
  const save = () => {
    const changes: ResearchChanges = {};
    const descriptions: string[] = [];
    if (stage !== item.stage) { changes.stage = stage; descriptions.push("เปลี่ยนขั้นตอนงานวิจัย"); }
    if (issue !== item.issue) { changes.issue = issue; descriptions.push(issue ? "อัปเดตประเด็นที่ติดขัด" : "ปิดประเด็นที่ติดขัด"); }
    if (nextTask !== item.nextTask) { changes.nextTask = nextTask; descriptions.push("อัปเดตผลการดำเนินงานปัจจุบัน"); }
    if (notes !== item.notes) { changes.notes = notes; descriptions.push("อัปเดตหมายเหตุ"); }
    if (dueDate !== item.dueDate) { changes.dueDate = dueDate; descriptions.push("ปรับกำหนดส่ง"); }
    const currentReview = item.myReview ?? item.review;
    if (maySetReview && review !== currentReview) { changes.review = review; descriptions.push(`เปลี่ยนสถานะตรวจเป็น ${reviewLabels[review]}`); }
    const primaryName = advisorOptions.find((entry) => entry.id === primaryAdvisorId)?.name ?? "";
    const secondaryNames = secondaryAdvisorIds.map((id) => advisorOptions.find((entry) => entry.id === id)?.name ?? id);
    const oldPrimary = item.primaryAdvisor ?? item.advisor[0] ?? "";
    const oldSecondary = item.secondaryAdvisors ?? item.advisor.filter((name) => name !== oldPrimary);
    const assignmentChanged = mayAssignAdvisors && (primaryName !== oldPrimary || [...secondaryNames].sort().join("|") !== [...oldSecondary].sort().join("|"));
    if (assignmentChanged) {
      descriptions.push("ปรับอาจารย์ที่ปรึกษาหลักและรอง");
      Object.assign(changes, { primaryAdvisor: primaryName, secondaryAdvisors: secondaryNames, advisor: [primaryName, ...secondaryNames], primaryAdvisorId, secondaryAdvisorIds });
    }
    if (maySetReview && comment.trim()) {
      descriptions.push("เพิ่มความเห็นจากที่ปรึกษ");
      changes.comments = [{ text: comment.trim(), date: new Date().toISOString(), by: person }, ...item.comments];
    }
    if (descriptions.length) onSave(item.id, changes, descriptions.join(" · "));
    onClose();
  };

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="@container max-h-[92svh] w-[calc(100%-1rem)] max-w-none gap-0 overflow-hidden rounded-2xl p-0 sm:w-[calc(100%-3rem)] sm:max-w-5xl">
      <div className="flex max-h-[92svh] min-h-0 flex-col">
        <DialogHeader className="shrink-0 bg-[#f8f4fb] px-4 py-5 sm:px-7"><span className="text-sm font-semibold text-[#755494]">รายละเอียดโครงการ</span><DialogTitle className="pr-9 text-xl font-semibold leading-snug text-[#362a42] sm:text-2xl">{item.title}</DialogTitle><Badge variant="secondary">{titleRoundLabel(item.titleVersion)}</Badge><DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"><span>{item.student}</span><span>·</span><span>{item.faculty || "ไม่ระบุหน่วยงาน"}</span><span>·</span><ReviewBadge status={item.review} /></DialogDescription></DialogHeader>
        <div className="flex shrink-0 gap-2 border-b border-[#eeeaf2] px-5 sm:px-7"><button onClick={() => setTab("รายละเอียด")} className={`min-h-11 border-b-2 px-2 text-sm font-semibold ${tab === "รายละเอียด" ? "border-[#704b8d] text-[#64417f]" : "border-transparent text-[#8a8292]"}`}>รายละเอียด</button><button onClick={() => setTab("ประวัติ")} className={`min-h-11 border-b-2 px-2 text-sm font-semibold ${tab === "ประวัติ" ? "border-[#704b8d] text-[#64417f]" : "border-transparent text-[#8a8292]"}`}>ประวัติการอัปเดต <span className="ml-1 rounded-full bg-[#f2edf7] px-2 py-0.5 text-xs">{item.history.length}</span></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#faf8fc] px-4 py-5 sm:px-7">
          {tab === "รายละเอียด" && (
            <ProjectTitleHistory
              key={item.titleVersion}
              item={item}
              canEdit={canEditResearchTitle({
                systemRole,
                isOwnerInAdviseeMode: role === "Advisee" && item.adviseeId === currentProfileId,
                version: item.titleVersion,
              })}
              onUpdate={onTitleUpdate}
            />
          )}
          {tab === "ประวัติ" ? <div className="space-y-4">{item.history.map((entry, index) => <div key={`${entry.date}-${index}`} className="flex gap-3"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#8764a3]" /><div className="min-w-0 flex-1 border-b border-[#f0edf3] pb-4"><p className="text-sm font-semibold leading-6 text-[#4b4055]">{entry.text}</p><p className="mt-1 text-sm text-[#8b8292]">{entry.by} · {formatThaiDate(entry.date.slice(0, 10), true)}</p></div></div>)}{item.history.length === 0 && <p className="rounded-xl bg-[#faf9fb] p-5 text-center text-sm text-[#817888]">ยังไม่มีประวัติการอัปเดต</p>}</div> : <div className="grid items-start gap-5 @min-[48rem]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="grid min-w-0 content-start gap-4 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2 sm:p-5">
              <Field label="ขั้นตอนปัจจุบัน" className="sm:col-span-2"><select value={stage} disabled={!mayEdit} onChange={(event) => setStage(Number(event.target.value))} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none disabled:bg-[#f5f3f7]"><option value="">เลือกขั้นตอน</option>{stages.map((name, index) => <option value={index} key={name}>{index}. {name}</option>)}</select></Field>
              <div className="space-y-2 sm:col-span-2">
                <p className="text-sm font-semibold text-foreground">ความคืบหน้าตามขั้นตอน</p>
                <Progress value={progress} />
              </div>
              <Field label="กำหนดส่ง" className="sm:col-span-2"><Input type="date" value={dueDate} disabled={!mayEdit} onChange={(event) => setDueDate(event.target.value)} className={`${fieldClass} disabled:bg-[#f5f3f7]`} /></Field>
              {mayAssignAdvisors && <>
                <Field label="อาจารย์ที่ปรึกษาหลัก" className="sm:col-span-2"><select value={primaryAdvisorId} onChange={(event) => { setPrimaryAdvisorId(event.target.value); setSecondaryAdvisorIds((current) => current.filter((id) => id !== event.target.value)); }} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none">{advisorOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></Field>
                <SecondaryAdvisorPicker
                  options={advisorOptions.filter((entry) => entry.id !== primaryAdvisorId)}
                  selectedIds={secondaryAdvisorIds}
                  onChange={setSecondaryAdvisorIds}
                />
              </>}
              <Field label="ปัญหาหรือสิ่งที่ติดขัด" className="sm:col-span-2"><Textarea rows={3} value={issue} disabled={!mayEdit} onChange={(event) => setIssue(event.target.value)} className={`${textareaClass} disabled:bg-[#f5f3f7]`} /></Field>
              <Field label="ผลการดำเนินงานปัจจุบัน" className="sm:col-span-2"><Textarea rows={2} value={nextTask} disabled={!mayEdit} onChange={(event) => setNextTask(event.target.value)} className={`${textareaClass} disabled:bg-[#f5f3f7]`} /></Field>
              <Field label="หมายเหตุ" className="sm:col-span-2"><Textarea rows={3} maxLength={4000} value={notes} disabled={!mayEdit} onChange={(event) => setNotes(event.target.value)} className={`${textareaClass} disabled:bg-[#f5f3f7]`} /></Field>
            </div>
            <div className="space-y-4">
              <Card className="rounded-2xl border-[#eeeaf2] bg-[#fcfbfd] shadow-none"><CardContent className="p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#51445d]"><MessageCircle className="size-4 text-[#765196]" />ผลประเมินที่ปรึกษา</div><div className="mt-3 space-y-2">{(item.advisorReviews ?? []).map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3"><span className="min-w-0"><span className="block wrap-break-word text-sm font-medium text-[#4e4358]">{entry.advisor}</span><span className="mt-0.5 block text-sm text-[#8b8292]">{entry.assignment === "PRIMARY" ? "อาจารย์หลัก" : "อาจารย์รอง"}</span></span><ReviewBadge status={entry.status} /></div>)}{(item.advisorReviews ?? []).length === 0 && <div className="text-sm text-[#8b8292]">ยังไม่มีผลประเมิน</div>}</div></CardContent></Card>
              {maySetReview && <Field label="สถานะการตรวจของ Advisor"><select value={review} onChange={(event) => setReview(event.target.value as ReviewStatus)} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none disabled:bg-[#f5f3f7]">{reviews.map((value) => <option key={value} value={value}>{reviewLabels[value]}</option>)}</select></Field>}
              <section
                ref={focusReview ? (element) => {
                  if (!element) return;
                  const frame = requestAnimationFrame(() => element.scrollIntoView({ block: "nearest" }));
                  return () => cancelAnimationFrame(frame);
                } : undefined}
                className="rounded-2xl border border-border bg-white p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MessageCircle aria-hidden className="size-4 text-primary" /> ความเห็นล่าสุด
                  </h3>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs tabular-nums text-primary">{item.comments.length} ความเห็น</span>
                </div>
                {item.comments.length ? (
                  <ol className="max-h-72 space-y-2.5 overflow-y-auto overscroll-contain">
                    {item.comments.map((entry, index) => (
                      <li key={`${entry.date}-${index}`} className="rounded-xl border border-[#ede6f1] bg-[#faf7fc] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <span className="min-w-0 wrap-break-word text-sm font-semibold text-foreground">{entry.by}</span>
                          <time dateTime={entry.date} className="inline-flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                            <Clock3 aria-hidden className="size-3.5" />
                            {commentTimestamp.format(new Date(entry.date))} น.
                          </time>
                        </div>
                        <p className="mt-2.5 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-[#51465c]">{entry.text}</p>
                      </li>
                    ))}
                  </ol>
                ) : <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">ยังไม่มีความเห็น</p>}
                {maySetReview && (
                  <label className="mt-4 block space-y-2 text-sm font-semibold">
                    <span>เขียนความเห็นหรือข้อเสนอแนะ</span>
                    <Textarea value={comment} onChange={(event) => setComment(event.target.value)} className={textareaClass} />
                  </label>
                )}
              </section>
            </div>
          </div>}
        </div>
        <DialogFooter className="shrink-0 flex-row flex-wrap justify-end border-t border-[#eeeaf2] bg-white px-4 py-3 sm:px-7">
          <Link href={`/projects/${encodeURIComponent(item.id)}/report`} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary sm:mr-auto">
            <FileDown aria-hidden className="size-4" /> Export PDF <span className="sr-only">(เปิดแท็บใหม่)</span>
          </Link>
          <Button variant="outline" onClick={onClose} className="h-11 rounded-xl">ปิด</Button>
          {tab === "รายละเอียด" && <Button onClick={save} className="h-11 rounded-xl"><Check className="size-4" />บันทึกการเปลี่ยนแปลง</Button>}
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>;
}
