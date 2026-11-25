import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ResearchPersonOption } from "@/features/users/types";
import { BookOpen, CalendarDays, Plus, UsersRound } from "lucide-react";
import { useState } from "react";
import { type ProjectInput } from "./project-dialog-types";
import { Field, fieldClass } from "./project-fields";
import { ProjectPersonSelect } from "./project-select";
import SecondaryAdvisorPicker from "./secondary-advisor-picker";
import ThaiDatePicker from "./thai-date-picker";

export function CreateProjectDialog({
  open,
  people,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  people: ResearchPersonOption[];
  onOpenChange: (open: boolean) => void;
  onCreate: (project: ProjectInput) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [student, setStudent] = useState("");
  const [primaryAdvisor, setPrimaryAdvisor] = useState("");
  const [secondaryAdvisorIds, setSecondaryAdvisorIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const students = people
    .filter(
      (entry) =>
        entry.capabilities.includes("ADVISEE") && entry.active !== false,
    )
    .map((entry) => ({ id: entry.id, name: entry.name }));
  const advisors = people
    .filter(
      (entry) =>
        entry.capabilities.includes("ADVISOR") && entry.active !== false,
    )
    .map((entry) => ({ id: entry.id, name: entry.name }));
  const primaryName =
    advisors.find((entry) => entry.id === primaryAdvisor)?.name ?? "";
  const secondaryNames = secondaryAdvisorIds.map(
    (id) => advisors.find((entry) => entry.id === id)?.name ?? id,
  );

  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !title.trim() || !student || !primaryAdvisor || !dueDate)
      return;
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        student:
          students.find((entry) => entry.id === student)?.name ?? student,
        advisor: [primaryName, ...secondaryNames],
        primaryAdvisor: primaryName,
        secondaryAdvisors: secondaryNames,
        stage: 0,
        progress: 0,
        dueDate,
        issue: "",
        nextTask: "",
        notes: "",
        review: "ยังไม่ส่งตรวจ",
        adviseeId: student,
        primaryAdvisorId: primaryAdvisor,
        secondaryAdvisorIds,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[92svh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl">
        <form onSubmit={submit} className="flex max-h-[92svh] min-h-0 flex-col">
          <DialogHeader className="shrink-0 border-b border-[#e7e0d9] bg-[#fffcf8] px-5 py-5 pr-14 sm:px-7 sm:pr-14">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <BookOpen aria-hidden className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-3xl font-bold text-foreground">
                  เพิ่มงานวิจัย
                </DialogTitle>
                <DialogDescription className="mt-1">
                  ระบุชื่อเรื่อง ผู้วิจัย ที่ปรึกษา และวันกำหนดส่ง
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f6f4f0] p-4 sm:p-6">
            <fieldset
              disabled={saving}
              className="grid min-w-0 items-start gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
            >
              <section className="min-w-0 space-y-4 rounded-xl border border-border bg-white p-4 sm:p-5">
                <h3 className="flex items-center gap-2 font-semibold">
                  <UsersRound aria-hidden className="size-4 text-primary" />{" "}
                  ข้อมูลโครงการและทีม
                </h3>
                <Field label="ชื่อเรื่องงานวิจัย">
                  <Input
                    required
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={fieldClass}
                  />
                </Field>
                <ProjectPersonSelect
                  label="นักวิจัย"
                  options={students}
                  value={student}
                  onChange={setStudent}
                  disabled={saving}
                />
                <ProjectPersonSelect
                  label="อาจารย์ที่ปรึกษาหลัก"
                  options={advisors}
                  value={primaryAdvisor}
                  disabled={saving}
                  onChange={(id) => {
                    setPrimaryAdvisor(id);
                    setSecondaryAdvisorIds((current) =>
                      current.filter((entry) => entry !== id),
                    );
                  }}
                />
                <SecondaryAdvisorPicker
                  options={advisors.filter(
                    (entry) => entry.id !== primaryAdvisor,
                  )}
                  selectedIds={secondaryAdvisorIds}
                  onChange={setSecondaryAdvisorIds}
                  disabled={saving}
                />
              </section>
              <section
                aria-labelledby="project-due-date-heading"
                className="min-w-0 space-y-3 rounded-xl border border-border bg-white p-4 sm:p-5"
              >
                <h3
                  id="project-due-date-heading"
                  className="flex items-center gap-2 font-semibold"
                >
                  <CalendarDays aria-hidden className="size-4 text-primary" />{" "}
                  กำหนดส่ง
                </h3>
                <ThaiDatePicker value={dueDate} onChange={setDueDate} />
              </section>
            </fieldset>
          </div>
          <DialogFooter className="shrink-0 bg-white px-5 py-4 sm:px-7">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={
                saving ||
                !title.trim() ||
                !student ||
                !primaryAdvisor ||
                !dueDate
              }
            >
              <Plus aria-hidden />{" "}
              {saving ? "กำลังสร้างโครงการ…" : "สร้างโครงการ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
