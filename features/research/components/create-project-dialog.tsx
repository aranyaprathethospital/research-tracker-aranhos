import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { UserDirectoryPerson } from "@/features/users/types";
import { fieldClass, Field } from "./project-fields";
import { type ProjectInput } from "./project-dialog-types";

export function CreateProjectDialog({ open, people, onOpenChange, onCreate }: { open: boolean; people: UserDirectoryPerson[]; onOpenChange: (open: boolean) => void; onCreate: (project: ProjectInput) => void }) {
  const [title, setTitle] = useState("");
  const [student, setStudent] = useState("");
  const [faculty, setFaculty] = useState("");
  const [primaryAdvisor, setPrimaryAdvisor] = useState("");
  const [secondaryAdvisorIds, setSecondaryAdvisorIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const students = people.filter((entry) => entry.capabilities.includes("ADVISEE") && entry.active !== false).map((entry) => ({ id: entry.id, name: entry.name }));
  const advisors = people.filter((entry) => entry.capabilities.includes("ADVISOR") && entry.active !== false).map((entry) => ({ id: entry.id, name: entry.name }));
  const primaryName = advisors.find((entry) => entry.id === primaryAdvisor)?.name ?? "";
  const secondaryNames = secondaryAdvisorIds.map((id) => advisors.find((entry) => entry.id === id)?.name ?? id);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !student || !primaryAdvisor || !dueDate) return;
    onCreate({ title: title.trim(), student: students.find((entry) => entry.id === student)?.name ?? student, faculty, advisor: [primaryName, ...secondaryNames], primaryAdvisor: primaryName, secondaryAdvisors: secondaryNames, stage: 0, progress: 0, dueDate, issue: "", nextTask: "", notes: "", review: "ยังไม่ส่งตรวจ", adviseeId: student, primaryAdvisorId: primaryAdvisor, secondaryAdvisorIds });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-[1.75rem] border-[#e9e3ed] p-0 sm:max-w-2xl">
      <div className="h-1.5 bg-gradient-to-r from-[#7750a4] to-[#85aa56]" />
      <form onSubmit={submit}>
        <DialogHeader className="px-5 pt-5 sm:px-7 sm:pt-7"><DialogTitle className="text-xl font-semibold text-[#362a42] sm:text-2xl">เพิ่มงานวิจัย</DialogTitle><DialogDescription className="text-base leading-6">สร้างโครงการและกำหนดทีมที่ปรึกษา</DialogDescription></DialogHeader>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
          <Field label="หัวข้องานวิจัย" className="sm:col-span-2"><Input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="ระบุชื่อหัวข้องานวิจัย" className={fieldClass} /></Field>
          <Field label="นักวิจัย"><select required value={student} onChange={(event) => setStudent(event.target.value)} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"><option value="">เลือกนักวิจัย</option>{students.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></Field>
          <Field label="คณะ / หน่วยงาน"><Input value={faculty} onChange={(event) => setFaculty(event.target.value)} placeholder="เช่น สาธารณสุขศาสตร์" className={fieldClass} /></Field>
          <Field label="อาจารย์ที่ปรึกษาหลัก" className="sm:col-span-2"><select required value={primaryAdvisor} onChange={(event) => { setPrimaryAdvisor(event.target.value); setSecondaryAdvisorIds((current) => current.filter((id) => id !== event.target.value)); }} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"><option value="">เลือกอาจารย์หลักหนึ่งคน</option>{advisors.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></Field>
          <fieldset className="rounded-2xl border border-[#ece7f0] p-4 sm:col-span-2"><legend className="px-1 text-sm font-semibold text-[#50445b]">อาจารย์ที่ปรึกษารอง <span className="font-normal text-[#898191]">(เลือกได้หลายคน)</span></legend><div className="grid gap-2 sm:grid-cols-2">{advisors.filter((entry) => entry.id !== primaryAdvisor).map((entry) => <label key={entry.id} className="flex min-h-11 items-center gap-3 rounded-xl bg-[#faf9fb] px-3 text-sm text-[#51465b]"><Checkbox checked={secondaryAdvisorIds.includes(entry.id)} onCheckedChange={(checked) => setSecondaryAdvisorIds((current) => checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))} className="size-5 data-checked:border-[#6d4a8b] data-checked:bg-[#6d4a8b]" />{entry.name}</label>)}</div></fieldset>
          <Field label="กำหนดส่ง" className="sm:col-span-2"><Input required type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={fieldClass} /></Field>
        </div>
        <DialogFooter className="flex-col-reverse border-t border-[#eeeaf2] bg-[#fcfbfd] px-5 py-4 sm:flex-row sm:px-7"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-xl">ยกเลิก</Button><Button type="submit" disabled={!title.trim() || !student || !primaryAdvisor || !dueDate} className="h-11 rounded-xl"><Plus className="size-4" />สร้างรายการ</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
