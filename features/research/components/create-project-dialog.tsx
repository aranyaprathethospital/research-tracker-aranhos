import { useId, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { BookOpen, CalendarDays, Check, ChevronDown, Plus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import SecondaryAdvisorPicker from "./secondary-advisor-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ResearchPersonOption } from "@/features/users/types";
import { fieldClass, Field } from "./project-fields";
import ThaiDatePicker from "./thai-date-picker";
import { type ProjectInput } from "./project-dialog-types";

export function CreateProjectDialog({ open, people, onOpenChange, onCreate }: { open: boolean; people: ResearchPersonOption[]; onOpenChange: (open: boolean) => void; onCreate: (project: ProjectInput) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [student, setStudent] = useState("");
  const [primaryAdvisor, setPrimaryAdvisor] = useState("");
  const [secondaryAdvisorIds, setSecondaryAdvisorIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const students = people.filter((entry) => entry.capabilities.includes("ADVISEE") && entry.active !== false).map((entry) => ({ id: entry.id, name: entry.name }));
  const advisors = people.filter((entry) => entry.capabilities.includes("ADVISOR") && entry.active !== false).map((entry) => ({ id: entry.id, name: entry.name }));
  const primaryName = advisors.find((entry) => entry.id === primaryAdvisor)?.name ?? "";
  const secondaryNames = secondaryAdvisorIds.map((id) => advisors.find((entry) => entry.id === id)?.name ?? id);

  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !title.trim() || !student || !primaryAdvisor || !dueDate) return;
    setSaving(true);
    try {
      await onCreate({ title: title.trim(), student: students.find((entry) => entry.id === student)?.name ?? student, advisor: [primaryName, ...secondaryNames], primaryAdvisor: primaryName, secondaryAdvisors: secondaryNames, stage: 0, progress: 0, dueDate, issue: "", nextTask: "", notes: "", review: "ยังไม่ส่งตรวจ", adviseeId: student, primaryAdvisorId: primaryAdvisor, secondaryAdvisorIds });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!saving) onOpenChange(nextOpen); }}>
      <DialogContent className="max-h-[92svh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl">
        <form onSubmit={submit} className="flex max-h-[92svh] min-h-0 flex-col">
          <DialogHeader className="shrink-0 border-b border-border bg-white px-5 py-5 pr-14 sm:px-7 sm:pr-14">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><BookOpen aria-hidden className="size-5" /></span>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground sm:text-2xl">เพิ่มงานวิจัย</DialogTitle>
                <DialogDescription className="mt-1">ระบุชื่อเรื่อง ผู้วิจัย ที่ปรึกษา และวันกำหนดส่ง</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#faf7fc] p-4 sm:p-6">
            <fieldset disabled={saving} className="grid min-w-0 items-start gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <section className="min-w-0 space-y-4 rounded-xl border border-border bg-white p-4 sm:p-5">
                <h3 className="flex items-center gap-2 font-semibold"><UsersRound aria-hidden className="size-4 text-primary" /> ข้อมูลโครงการและทีม</h3>
                <Field label="ชื่อเรื่องงานวิจัย"><Input required value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} /></Field>
                <ProjectPersonSelect label="นักวิจัย" options={students} value={student} onChange={setStudent} disabled={saving} />
                <ProjectPersonSelect
                  label="อาจารย์ที่ปรึกษาหลัก"
                  options={advisors}
                  value={primaryAdvisor}
                  disabled={saving}
                  onChange={(id) => {
                    setPrimaryAdvisor(id);
                    setSecondaryAdvisorIds((current) => current.filter((entry) => entry !== id));
                  }}
                />
                <SecondaryAdvisorPicker
                  options={advisors.filter((entry) => entry.id !== primaryAdvisor)}
                  selectedIds={secondaryAdvisorIds}
                  onChange={setSecondaryAdvisorIds}
                  disabled={saving}
                />
              </section>
              <section aria-labelledby="project-due-date-heading" className="min-w-0 space-y-3 rounded-xl border border-border bg-white p-4 sm:p-5">
                <h3 id="project-due-date-heading" className="flex items-center gap-2 font-semibold"><CalendarDays aria-hidden className="size-4 text-primary" /> กำหนดส่ง</h3>
                <ThaiDatePicker value={dueDate} onChange={setDueDate} />
              </section>
            </fieldset>
          </div>
          <DialogFooter className="shrink-0 bg-white px-5 py-4 sm:px-7">
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>ยกเลิก</Button>
            <Button type="submit" disabled={saving || !title.trim() || !student || !primaryAdvisor || !dueDate}>
              <Plus aria-hidden /> {saving ? "กำลังสร้างโครงการ…" : "สร้างโครงการ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectPersonSelect({ label, options, value, onChange, disabled }: {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-[#51465b]">{label}</label>
      <Combobox.Root
        items={options}
        value={options.find((option) => option.id === value) ?? null}
        onValueChange={(next) => onChange(next?.id ?? "")}
        itemToStringLabel={(item) => item.name}
        itemToStringValue={(item) => item.id}
        isItemEqualToValue={(item, selected) => item.id === selected.id}
        disabled={disabled || options.length === 0}
        autoHighlight
      >
        <div className="relative">
          <Combobox.Input id={id} render={<Input className="h-11 rounded-xl pr-11 text-base" />} />
          <Combobox.Trigger type="button" aria-label={`เปิดรายชื่อ${label}`} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
            <ChevronDown aria-hidden className="size-4" />
          </Combobox.Trigger>
        </div>
        {!options.length && <p className="text-xs text-muted-foreground">ไม่มีรายชื่อให้เลือก</p>}
        <Combobox.Portal>
          <Combobox.Positioner align="start" sideOffset={6} className="z-[60]">
            <Combobox.Popup className="w-(--anchor-width) max-w-(--available-width) rounded-xl border border-border bg-white p-1.5 shadow-xl">
              <Combobox.Empty className="empty:hidden px-3 py-2 text-sm text-muted-foreground">ไม่พบชื่อที่ค้นหา</Combobox.Empty>
              <Combobox.List className="max-h-[min(13.75rem,calc(var(--available-height)-1rem))] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
                {(option: (typeof options)[number]) => (
                  <Combobox.Item key={option.id} value={option} className="flex h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 text-sm outline-none data-highlighted:bg-secondary data-selected:font-semibold data-selected:text-primary">
                    <span className="min-w-0 truncate" title={option.name}>{option.name}</span>
                    <Combobox.ItemIndicator><Check aria-hidden className="size-4 shrink-0" /></Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}
