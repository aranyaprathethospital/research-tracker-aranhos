import { useState } from "react";
import { CalendarDays, Check, Clock3, FileDown, MessageCircle, Trash2 } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import Link from "next/link";
import { canEditResearchTitle, progressFromStage, titleRoundLabel, stages, type Research, type ReviewStatus, type Role } from "@/lib/research-types";
import ProjectTitleHistory from "./project-title-history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SecondaryAdvisorPicker from "./secondary-advisor-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select";
import type { ResearchPersonOption } from "@/features/users/types";
import { reviewLabels, reviews, formatCommentDate, formatThaiDate, ReviewBadge, Progress, DueDate } from "./project-display";
import { textareaClass, Field } from "./project-fields";
import { type ResearchChanges } from "./project-dialog-types";
import { ProjectPersonSelect, StageSelect } from "./project-select";
import ThaiDatePicker from "./thai-date-picker";

const reviewOptions = reviews.map((value) => ({ label: reviewLabels[value], value }));

export function ProjectDialog({ item, focusReview, role, systemRole, person, currentProfileId, onTitleUpdate, people, onClose, onSave, onDelete }: {
  focusReview?: boolean; item: Research; role: Role; systemRole: string; person: string; currentProfileId: string; onTitleUpdate: (project: Research) => void;
  people: ResearchPersonOption[]; onClose: () => void; onSave: (id: string, updates: ResearchChanges, description: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [stage, setStage] = useState(item.stage);
  const progress = progressFromStage(stage);
  const [issue, setIssue] = useState(item.issue);
  const [nextTask, setNextTask] = useState(item.nextTask);
  const [notes, setNotes] = useState(item.notes);
  const [dueDate, setDueDate] = useState(item.dueDate);
  const [dateOpen, setDateOpen] = useState(false);
  const [review, setReview] = useState<ReviewStatus>(item.myReview ?? item.review);
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState<"รายละเอียด" | "ประวัติ">("รายละเอียด");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [saveError, setSaveError] = useState("");
  const isManager = role === "PM" || role === "Superadmin" || systemRole === "PM" || systemRole === "SUPERADMIN";
  const mayEdit = isManager || (role === "Advisee" && currentProfileId === item.adviseeId);
  const mayAssignAdvisors = systemRole === "PM";
  const maySetReview = role === "Advisor" && item.isMyAdvisor === true;
  const advisorOptions = people.filter((entry) => entry.capabilities.includes("ADVISOR") && entry.active !== false).map((entry) => ({ id: entry.id, name: entry.name }));
  const originalPrimary = item.advisorReviews?.find((entry) => entry.assignment === "PRIMARY");
  const originalSecondary = item.advisorReviews?.filter((entry) => entry.assignment === "SECONDARY") ?? [];
  const [primaryAdvisorId, setPrimaryAdvisorId] = useState(originalPrimary?.id ?? "");
  const [secondaryAdvisorIds, setSecondaryAdvisorIds] = useState(() => originalSecondary.map((entry) => entry.id));
  const primaryOptions = originalPrimary && !advisorOptions.some(({ id }) => id === originalPrimary.id)
    ? [{ id: originalPrimary.id, name: originalPrimary.advisor }, ...advisorOptions] : advisorOptions;
  const secondaryOptions = [...advisorOptions, ...originalSecondary.filter((entry) => !advisorOptions.some(({ id }) => id === entry.id)).map((entry) => ({ id: entry.id, name: entry.advisor }))];
  const currentReview = item.myReview ?? item.review;
  const assignmentChanged = mayAssignAdvisors && (primaryAdvisorId !== (originalPrimary?.id ?? "") || secondaryAdvisorIds.length !== originalSecondary.length || secondaryAdvisorIds.some((id) => !originalSecondary.some((entry) => entry.id === id)));
  const detailsChanged = mayEdit && (stage !== item.stage || issue !== item.issue || nextTask !== item.nextTask || notes !== item.notes || dueDate !== item.dueDate);
  const hasChanges = detailsChanged || assignmentChanged || (maySetReview && (review !== currentReview || Boolean(comment.trim())));

  const save = async () => {
    if (!hasChanges || saving) return;
    const changes: ResearchChanges = {};
    const descriptions: string[] = [];
    if (stage !== item.stage) { changes.stage = stage; descriptions.push("เปลี่ยนขั้นตอนงานวิจัย"); }
    if (issue !== item.issue) { changes.issue = issue; descriptions.push(issue ? "อัปเดตประเด็นที่ติดขัด" : "ปิดประเด็นที่ติดขัด"); }
    if (nextTask !== item.nextTask) { changes.nextTask = nextTask; descriptions.push("อัปเดตผลการดำเนินงานปัจจุบัน"); }
    if (notes !== item.notes) { changes.notes = notes; descriptions.push("อัปเดตหมายเหตุ"); }
    if (dueDate !== item.dueDate) { changes.dueDate = dueDate; descriptions.push("ปรับกำหนดส่ง"); }
    if (maySetReview && review !== currentReview) { changes.review = review; descriptions.push(`เปลี่ยนสถานะตรวจเป็น ${reviewLabels[review]}`); }
    if (assignmentChanged) {
      if (!primaryAdvisorId) { setSaveError("กรุณาเลือกอาจารย์ที่ปรึกษาหลัก"); return; }
      descriptions.push("ปรับอาจารย์ที่ปรึกษาหลักและรอง");
      changes.primaryAdvisorId = primaryAdvisorId;
      changes.secondaryAdvisorIds = secondaryAdvisorIds;
    }
    if (maySetReview && comment.trim()) {
      descriptions.push("เพิ่มความเห็นจากที่ปรึกษา");
      changes.comments = [{ text: comment.trim(), date: new Date().toISOString(), by: person }, ...item.comments];
    }
    setSaveError("");
    setSaving(true);
    try {
      await onSave(item.id, changes, descriptions.join(" · "));
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  async function removeProject() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await onDelete(item.id);
      onClose();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "ลบงานวิจัยไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !saving && !confirmDelete) onClose(); }}>
    <DialogContent className="@container max-h-[92svh] w-[calc(100%-1rem)] max-w-none gap-0 overflow-hidden rounded-2xl p-0 sm:w-[calc(100%-3rem)] sm:max-w-5xl">
      <div className="flex max-h-[92svh] min-h-0 flex-col">
        <DialogHeader className="shrink-0 border-t-4 border-t-[#735388] bg-[#fffcf8] px-4 py-5 sm:px-7">
          <span className="text-base font-bold text-primary">รายละเอียดโครงการ</span>
          <DialogTitle className="max-h-[22svh] overflow-y-auto pr-9 wrap-break-word text-3xl font-bold leading-tight text-[#362a42] sm:text-4xl">{item.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base"><span>{item.student}</span><Badge variant="secondary">{titleRoundLabel(item.titleVersion)}</Badge><ReviewBadge status={item.review} /></DialogDescription>
        </DialogHeader>
        <div role="group" aria-label="มุมมองรายละเอียดโครงการ" className="flex shrink-0 gap-3 border-b border-[#e7e0d9] px-4 sm:px-7">
          {(["รายละเอียด", "ประวัติ"] as const).map((view) => <button key={view} type="button" aria-pressed={tab === view} disabled={saving} onClick={() => setTab(view)} className={`min-h-11 border-b-2 px-1 text-base font-bold focus-visible:outline-2 focus-visible:outline-primary ${tab === view ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{view === "รายละเอียด" ? view : `ประวัติการอัปเดต (${item.history.length})`}</button>)}
        </div>
        <div aria-busy={saving} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f6f4f0] px-4 py-4 sm:px-7 sm:py-5">
          {tab === "รายละเอียด" && (
            <ProjectTitleHistory
              key={`${item.titleVersion}:${item.title}`}
              item={item}
              canEdit={canEditResearchTitle({
                systemRole,
                isOwnerInAdviseeMode: role === "Advisee" && item.adviseeId === currentProfileId,
                version: item.titleVersion,
              })}
              onUpdate={onTitleUpdate}
            />
          )}
          {tab === "ประวัติ" ? (
            <ol className="divide-y divide-[#eee8e2] rounded-xl border border-[#e7e0d9] bg-white px-4 sm:px-6">
              {item.history.map((entry, index) => <li key={`${entry.date}-${index}`} className="flex gap-3 py-4">
                <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0"><p className="wrap-break-word text-lg font-bold leading-tight">{entry.text}</p><p className="mt-0.5 text-base text-muted-foreground">{entry.by} · <time dateTime={entry.date}>{formatCommentDate(entry.date)} น.</time></p></div>
              </li>)}
              {item.history.length === 0 && <li className="p-5 text-center text-base text-muted-foreground">ยังไม่มีประวัติการอัปเดต</li>}
            </ol>
          ) : <div className="grid items-start gap-4 @min-[48rem]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <fieldset disabled={saving} className="min-w-0 space-y-5 rounded-xl border border-[#e7e0d9] bg-white p-4 sm:p-5">
              <h3 className="text-xl font-bold">ความคืบหน้าและกำหนดส่ง</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] items-start gap-4">
                <div className="space-y-2">
                  <p className="text-base font-bold">ขั้นตอนปัจจุบัน</p>
                  {mayEdit ? <StageSelect value={String(stage)} disabled={saving} onChange={(value) => setStage(Number(value))} /> : <p className="text-lg text-muted-foreground">{stages[stage]}</p>}
                  <Progress value={progress} />
                </div>
                <div className="space-y-2">
                  <p className="text-base font-bold">กำหนดส่ง</p>
                  {mayEdit ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Popover.Root open={dateOpen} onOpenChange={setDateOpen}>
                        <Popover.Trigger disabled={saving} render={<Button variant="outline" type="button" className="min-w-40 justify-start" />} aria-label={dueDate ? `เปลี่ยนกำหนดส่ง ปัจจุบัน ${formatThaiDate(dueDate)}` : "เลือกกำหนดส่ง"}>
                          {dueDate ? <DueDate date={dueDate} /> : <><CalendarDays aria-hidden />เลือกวันที่</>}
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Positioner sideOffset={6} align="start" collisionPadding={12} className="z-[60]">
                            <Popover.Popup className="max-h-(--available-height) w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl bg-white shadow-xl">
                              <ThaiDatePicker key={String(dateOpen)} value={dueDate} onChange={(date) => { setDueDate(date); setDateOpen(false); }} />
                            </Popover.Popup>
                          </Popover.Positioner>
                        </Popover.Portal>
                      </Popover.Root>
                      {dueDate && <Button type="button" variant="ghost" size="sm" onClick={() => setDueDate("")}>ล้างวันที่</Button>}
                    </div>
                  ) : <DueDate date={dueDate} />}
                </div>
              </div>
              {mayAssignAdvisors && <div className="space-y-4 border-t border-border pt-4">
                <ProjectPersonSelect label="อาจารย์ที่ปรึกษาหลัก" options={primaryOptions} value={primaryAdvisorId} disabled={saving} onChange={(id) => {
                  setPrimaryAdvisorId(id);
                  setSecondaryAdvisorIds((current) => current.filter((entry) => entry !== id));
                }} />
                <SecondaryAdvisorPicker
                  options={secondaryOptions.filter((entry) => entry.id !== primaryAdvisorId)}
                  selectedIds={secondaryAdvisorIds}
                  onChange={setSecondaryAdvisorIds}
                  disabled={saving}
                />
              </div>}
              <ProjectText label="ผลการดำเนินงานปัจจุบัน" value={nextTask} editable={mayEdit} onChange={setNextTask} />
              <ProjectText label="ปัญหาหรือสิ่งที่ติดขัด" value={issue} editable={mayEdit} onChange={setIssue} />
              <ProjectText label="หมายเหตุ" value={notes} editable={mayEdit} onChange={setNotes} />
            </fieldset>
            <div className="space-y-4">
              <Card className="rounded-2xl border-[#eeeaf2] bg-[#fcfbfd] shadow-none"><CardContent className="p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#51445d]"><MessageCircle className="size-4 text-[#765196]" />ผลประเมินที่ปรึกษา</div><div className="mt-3 space-y-2">{(item.advisorReviews ?? []).map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3"><span className="min-w-0"><span className="block wrap-break-word text-sm font-medium text-[#4e4358]">{entry.advisor}</span><span className="mt-0.5 block text-sm text-[#8b8292]">{entry.assignment === "PRIMARY" ? "อาจารย์หลัก" : "อาจารย์รอง"}</span></span><ReviewBadge status={entry.status} /></div>)}{(item.advisorReviews ?? []).length === 0 && <div className="text-sm text-[#8b8292]">ยังไม่มีผลประเมิน</div>}</div></CardContent></Card>
              {maySetReview && <div className="space-y-2 rounded-xl border border-[#e7e0d9] bg-white p-4"><p className="text-base font-bold">สถานะการตรวจของคุณ</p><SelectField label="สถานะการตรวจของคุณ" value={review} options={reviewOptions} disabled={saving} onChange={setReview} /></div>}
              <section
                ref={focusReview ? (element) => {
                  if (!element) return;
                  const frame = requestAnimationFrame(() => element.scrollIntoView({ block: "nearest" }));
                  return () => cancelAnimationFrame(frame);
                } : undefined}
                className="rounded-xl border border-[#e7e0d9] bg-white p-4"
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
                            {formatCommentDate(entry.date)} น.
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
                    <Textarea value={comment} maxLength={4000} disabled={saving} onChange={(event) => setComment(event.target.value)} className={textareaClass} />
                  </label>
                )}
              </section>
            </div>
          </div>}
        </div>
        {saveError && <p role="alert" className="shrink-0 border-t border-rose-200 bg-rose-50 px-4 py-2 text-base text-rose-800 sm:px-7">{saveError}</p>}
        <DialogFooter className="shrink-0 flex-row flex-wrap justify-end border-t border-[#e7e0d9] bg-white px-4 py-3 sm:px-7">
          {onDelete && <Button type="button" variant="ghost" disabled={saving} className="text-destructive" onClick={() => { setDeleteError(""); setConfirmDelete(true); }}><Trash2 aria-hidden />ลบงานวิจัย</Button>}
          <Link href={`/projects/${encodeURIComponent(item.id)}/report`} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary sm:mr-auto">
            <FileDown aria-hidden className="size-4" /> รายงาน PDF <span className="sr-only">(เปิดแท็บใหม่)</span>
          </Link>
          <Button variant="outline" onClick={onClose} disabled={saving}>ปิด</Button>
          {tab === "รายละเอียด" && (mayEdit || maySetReview) && <Button type="button" onClick={() => void save()} disabled={!hasChanges || saving}><Check aria-hidden />{saving ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}</Button>}
        </DialogFooter>
      </div>
      {onDelete && <Dialog open={confirmDelete} onOpenChange={(open) => { if (!deleting) setConfirmDelete(open); }}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">ลบงานวิจัย</DialogTitle>
            <DialogDescription>โครงการนี้จะถูกลบพร้อมประวัติชื่อเรื่อง ความคืบหน้า และความเห็น การลบนี้กู้คืนจากหน้าเว็บไม่ได้</DialogDescription>
          </DialogHeader>
          <p className="max-h-32 overflow-y-auto wrap-break-word rounded-lg bg-secondary px-3 py-2 font-bold">{item.title}</p>
          {deleteError && <p role="alert" className="text-destructive">{deleteError}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setConfirmDelete(false)}>ยกเลิก</Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={() => void removeProject()}>{deleting ? "กำลังลบ…" : "ยืนยันลบงานวิจัย"}</Button>
          </div>
        </DialogContent>
      </Dialog>}
    </DialogContent>
  </Dialog>;
}

function ProjectText({ label, value, editable, onChange }: { label: string; value: string; editable: boolean; onChange: (value: string) => void }) {
  if (!editable) return <div><p className="text-base font-bold">{label}</p><p className="mt-1 whitespace-pre-wrap wrap-break-word text-base text-muted-foreground">{value || "ยังไม่ระบุ"}</p></div>;
  return <Field label={label}><Textarea rows={3} maxLength={4000} value={value} onChange={(event) => onChange(event.target.value)} className={textareaClass} /></Field>;
}
