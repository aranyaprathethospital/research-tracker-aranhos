"use client";

import { useState, type FormEvent } from "react";
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { KeyRound, Mail, Plus, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Person = {
  id: string; name: string; fullName?: string; systemRole: string; capabilities: string[]; email?: string;
  position?: string; positionLevel?: string; mission?: string; workGroup?: string;
  providerId?: string | null; cidRegistered?: boolean; active?: boolean; userId?: string | null;
  avatarUrl?: string | null; signatureUrl?: string | null;
};

const capabilityNames: Record<string, string> = { ADVISOR: "Advisor", ADVISEE: "Advisee" };
const systemRoleNames: Record<string, string> = { USER: "ผู้ใช้ทั่วไป", PM: "PM", SUPERADMIN: "Superadmin" };
const inputClass = "h-11 rounded-xl border-[#e7e1eb] bg-white text-base focus-visible:border-[#9774b2] focus-visible:ring-[#9774b2]/20";

export default function UserDirectory({ people, onChange, canAssignSystemRole }: { people: Person[]; onChange: (people: Person[]) => void; canAssignSystemRole: boolean }) {
  const [cid, setCid] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [systemRole, setSystemRole] = useState("USER");
  const [capabilities, setCapabilities] = useState<string[]>(["ADVISEE"]);
  const [position, setPosition] = useState("");
  const [positionLevel, setPositionLevel] = useState("");
  const [mission, setMission] = useState("");
  const [workGroup, setWorkGroup] = useState("");
  const [busy, setBusy] = useState(false);
  const [cidPerson, setCidPerson] = useState<Person | null>(null);
  const [nextCid, setNextCid] = useState("");
  const columns: LegacyColumnDef<Person>[] = [
    { accessorKey: "fullName", header: "ผู้ใช้" },
    { accessorKey: "email", header: "อีเมล" },
    { accessorKey: "providerId", header: "ProviderID" },
    { accessorKey: "capabilities", header: "บทบาท" },
    { accessorKey: "active", header: "สถานะ" },
    { id: "actions", header: "จัดการ" },
  ];
  const table = useLegacyTable<Person>({ data: people, columns, getCoreRowModel: getCoreRowModel() });

  const addPerson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cid, fullName, email, systemRole, capabilities, position, positionLevel, mission, workGroup }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "เพิ่มรายชื่อไม่สำเร็จ");
      onChange([...people, result.person as Person]);
      setCid(""); setFullName(""); setEmail(""); setPosition(""); setPositionLevel(""); setMission(""); setWorkGroup("");
      setCapabilities(["ADVISEE"]); setSystemRole("USER");
      toast.success("เพิ่มรายชื่อแล้ว ผู้ใช้ต้องเข้า ProviderID ครั้งแรกก่อนตั้ง Email และรหัสผ่านสำรอง");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เพิ่มรายชื่อไม่สำเร็จ");
    } finally { setBusy(false); }
  };

  const editPerson = async (person: Person, changes: Record<string, unknown>) => {
    const response = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: person.id, ...changes }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "ปรับข้อมูลผู้ใช้ไม่สำเร็จ");
    onChange(people.map((entry) => entry.id === person.id ? { ...entry, ...result.person } : entry));
    return result.person as Person;
  };

  const updateCid = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cidPerson) return;
    try {
      await editPerson(cidPerson, { cid: nextCid });
      toast.success("บันทึก CID แล้ว");
      setCidPerson(null);
      setNextCid("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "บันทึก CID ไม่สำเร็จ"); }
  };

  const resetPassword = async (person: Person) => {
    try {
      const response = await fetch("/api/users/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: person.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "ออกรหัสผ่านชั่วคราวไม่สำเร็จ");
      toast.success(`รหัสชั่วคราวสำหรับ ${person.name}: ${result.temporaryPassword}`, { duration: 15000 });
    } catch (error) { toast.error(error instanceof Error ? error.message : "ออกรหัสผ่านชั่วคราวไม่สำเร็จ"); }
  };

  const setCapability = async (person: Person, capability: string, checked: boolean) => {
    const next = checked ? [...person.capabilities, capability] : person.capabilities.filter((item) => item !== capability);
    try { await editPerson(person, { capabilities: next }); }
    catch (error) { toast.error(error instanceof Error ? error.message : "ปรับสิทธิ์ไม่สำเร็จ"); }
  };

  return <div className="space-y-5">
    <Card className="rounded-[1.75rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025]">
      <CardHeader className="flex flex-col gap-4 px-5 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
        <div><span className="inline-flex items-center gap-2 rounded-full bg-[#f2edf7] px-3 py-1.5 text-sm font-semibold text-[#6d4a8b]"><ShieldCheck className="size-4" /> จัดการสิทธิ์เข้าใช้งาน</span><CardTitle className="mt-3 text-lg font-semibold text-[#382d43] sm:text-xl">ผู้ใช้และบทบาท</CardTitle><CardDescription className="mt-1 max-w-3xl text-base leading-6">ลงทะเบียน CID ก่อนเข้า ProviderID · PM จัดการ Advisor/Advisee · Superadmin จัดการสิทธิ์ PM</CardDescription></div>
        <Badge variant="outline" className="h-9 w-fit rounded-full border-[#e6e0ea] bg-white px-3 text-sm font-semibold text-[#655a70]"><Users className="mr-1.5 size-4" />{people.length} รายชื่อ</Badge>
      </CardHeader>
      <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
        <form onSubmit={addPerson} className="grid gap-4 rounded-2xl border border-[#eeeaf2] bg-[#fcfbfd] p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <Field label="CID 13 หลัก" className="lg:col-span-2"><Input required value={cid} onChange={(event) => setCid(event.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="เลขบัตรประชาชน" inputMode="numeric" autoComplete="off" maxLength={13} className={inputClass} /></Field>
          <Field label="ชื่อเต็ม" className="lg:col-span-2"><Input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="ชื่อและนามสกุล" autoComplete="name" className={inputClass} /></Field>
          <Field label="Email (ถ้ามี)" className="lg:col-span-2"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" className={inputClass} /></Field>
          <Field label="ตำแหน่ง"><Input value={position} onChange={(event) => setPosition(event.target.value)} placeholder="เช่น นักวิชาการสาธารณสุข" className={inputClass} /></Field>
          <Field label="ระดับตำแหน่ง"><Input value={positionLevel} onChange={(event) => setPositionLevel(event.target.value)} placeholder="เช่น ชำนาญการ" className={inputClass} /></Field>
          <Field label="ภารกิจ"><Input value={mission} onChange={(event) => setMission(event.target.value)} className={inputClass} /></Field>
          <Field label="กลุ่มงาน"><Input value={workGroup} onChange={(event) => setWorkGroup(event.target.value)} className={inputClass} /></Field>
          {canAssignSystemRole && <Field label="สิทธิ์ระบบ"><select value={systemRole} onChange={(event) => setSystemRole(event.target.value)} className="h-11 w-full rounded-xl border border-[#e7e1eb] bg-white px-3 text-base outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"><option value="USER">ผู้ใช้ทั่วไป</option><option value="PM">PM</option><option value="SUPERADMIN">Superadmin</option></select></Field>}
          <fieldset className="rounded-2xl border border-[#e8e3ed] bg-white p-3 sm:col-span-2 lg:col-span-2"><legend className="px-1 text-sm font-semibold text-[#554a60]">โหมดที่อนุญาต</legend><div className="flex flex-wrap gap-3">{["ADVISEE", "ADVISOR"].map((capability) => <label key={capability} className="flex min-h-9 items-center gap-2 rounded-xl bg-[#faf9fb] px-3 text-sm font-medium text-[#51465b]"><Checkbox checked={capabilities.includes(capability)} onCheckedChange={(checked) => setCapabilities((current) => checked === true ? [...current, capability] : current.filter((item) => item !== capability))} className="size-5 data-checked:border-[#6d4a8b] data-checked:bg-[#6d4a8b]" />{capabilityNames[capability]}</label>)}</div></fieldset>
          <div className="flex items-end sm:col-span-2 lg:col-span-4"><Button type="submit" disabled={busy || cid.length !== 13 || !fullName.trim()} className="h-11 w-full rounded-xl sm:w-auto"><Plus className="size-4" />{busy ? "กำลังเพิ่มรายชื่อ…" : "เพิ่มผู้ใช้"}</Button></div>
        </form>
      </CardContent>
    </Card>

    {people.length === 0 ? <Card className="rounded-[1.75rem] border-dashed border-[#dcd4e3] bg-white shadow-none"><CardContent className="px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f2edf7] text-[#704b8d]"><Users className="size-5" /></span><h2 className="mt-4 text-base font-semibold text-[#463a50]">ยังไม่มีรายชื่อในระบบ</h2><p className="mt-1 text-sm text-[#817888]">เพิ่มผู้ใช้ด้วย CID และชื่อเต็มเพื่อเริ่มกำหนดสิทธิ์</p></CardContent></Card> : <>
      <div className="grid gap-3 md:hidden">{people.map((person) => <PersonCard key={person.id} person={person} canAssignSystemRole={canAssignSystemRole} onEdit={editPerson} onEditCid={() => { setCidPerson(person); setNextCid(""); }} onResetPassword={() => void resetPassword(person)} onSetCapability={setCapability} />)}</div>
      <Card className="hidden overflow-hidden rounded-[1.75rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025] md:block">
        <div className="overflow-x-auto"><table className="w-full min-w-[1000px] border-collapse text-left">
          <thead><tr>{table.getHeaderGroups()[0]?.headers.map((header) => <th key={header.id} className="h-12 border-b border-[#eeeaf2] bg-[#faf9fb] px-4 text-xs font-bold uppercase tracking-wide text-[#8b8292]">{typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : header.id}</th>)}</tr></thead>
          <tbody>{table.getRowModel().rows.map((row) => <PersonTableRow key={row.id} person={row.original} canAssignSystemRole={canAssignSystemRole} onEdit={editPerson} onEditCid={() => { setCidPerson(row.original); setNextCid(""); }} onResetPassword={() => void resetPassword(row.original)} onSetCapability={setCapability} />)}</tbody>
        </table></div>
      </Card>
    </>}

    <Dialog open={Boolean(cidPerson)} onOpenChange={(open) => { if (!open) setCidPerson(null); }}>
      <DialogContent className="rounded-[1.5rem] border-[#e9e3ed] sm:max-w-md">
        <DialogHeader><DialogTitle className="text-xl font-semibold text-[#382d43]">{cidPerson?.cidRegistered ? "แก้ไข CID" : "เพิ่ม CID"}</DialogTitle><DialogDescription className="text-base leading-6">CID ใช้เชื่อมบัญชี ProviderID ของ {cidPerson?.fullName ?? cidPerson?.name}</DialogDescription></DialogHeader>
        <form onSubmit={updateCid} className="space-y-4"><Field label="เลขประจำตัวประชาชน 13 หลัก"><Input required inputMode="numeric" autoComplete="off" maxLength={13} value={nextCid} onChange={(event) => setNextCid(event.target.value.replace(/\D/g, "").slice(0, 13))} className={inputClass} /></Field><DialogFooter><Button type="button" variant="outline" onClick={() => setCidPerson(null)} className="h-11 rounded-xl">ยกเลิก</Button><Button type="submit" disabled={nextCid.length !== 13} className="h-11 rounded-xl">บันทึก CID</Button></DialogFooter></form>
      </DialogContent>
    </Dialog>
  </div>;
}

function PersonTableRow({ person, canAssignSystemRole, onEdit, onEditCid, onResetPassword, onSetCapability }: { person: Person; canAssignSystemRole: boolean; onEdit: (person: Person, changes: Record<string, unknown>) => Promise<Person>; onEditCid: () => void; onResetPassword: () => void; onSetCapability: (person: Person, capability: string, checked: boolean) => Promise<void> }) {
  return <tr className="border-b border-[#f0edf3] align-top transition last:border-0 hover:bg-[#fcfbfd]">
    <td className="px-4 py-4"><div className="flex items-center gap-3"><Avatar className="size-10 rounded-xl"><AvatarImage src={person.avatarUrl ?? undefined} alt="" /><AvatarFallback className="rounded-xl bg-[#f2edf7] text-sm font-semibold text-[#694786]">{(person.fullName ?? person.name).trim().slice(0, 1)}</AvatarFallback></Avatar><span><span className="block max-w-52 truncate text-sm font-semibold text-[#40344a]">{person.fullName ?? person.name}</span><span className="mt-1 block max-w-56 truncate text-sm text-[#8b8292]">{[person.position, person.positionLevel, person.mission, person.workGroup].filter(Boolean).join(" · ") || "ยังไม่ระบุข้อมูลตำแหน่ง"}</span></span></div></td>
    <td className="px-4 py-4 text-sm text-[#675d71]">{person.email || "ยังไม่ตั้งค่า"}</td><td className="px-4 py-4 text-sm text-[#675d71]">{person.providerId || "รอเข้าใช้ครั้งแรก"}</td>
    <td className="px-4 py-4">{person.userId ? <Badge variant="outline" className="rounded-full border-[#dcebd1] bg-[#eff7e9] text-[#4e702f]">เชื่อมแล้ว</Badge> : <Button variant="ghost" onClick={onEditCid} className="h-9 rounded-lg px-2 text-[#674382]">{person.cidRegistered ? "แก้ CID" : "เพิ่ม CID"}</Button>}</td>
    <td className="max-w-60 px-4 py-4"><div className="flex flex-wrap gap-1.5">{person.systemRole !== "USER" && <Badge variant="outline" className="rounded-full border-[#e5d9ed] bg-[#f7f1fa] text-[#694786]">{systemRoleNames[person.systemRole] ?? person.systemRole}</Badge>}{person.capabilities.map((capability) => <Badge key={capability} variant="outline" className="rounded-full border-[#e1e7da] bg-[#f3f7ee] text-[#5a7439]">{capabilityNames[capability] ?? capability}</Badge>)}</div><details className="group mt-2"><summary className="min-h-9 cursor-pointer list-none text-sm font-semibold text-[#674382] marker:hidden">ปรับสิทธิ์และข้อมูล <span className="ml-1 text-xs text-[#928998] group-open:hidden">+</span><span className="ml-1 hidden text-xs text-[#928998] group-open:inline">−</span></summary><div className="mt-2 space-y-2 rounded-xl border border-[#eeeaf2] bg-white p-3">{canAssignSystemRole && <select value={person.systemRole} onChange={(event) => void onEdit(person, { systemRole: event.target.value }).catch((error) => toast.error(error.message))} className="h-10 w-full rounded-lg border border-[#e7e1eb] bg-white px-2 text-sm"><option value="USER">ผู้ใช้ทั่วไป</option><option value="PM">PM</option><option value="SUPERADMIN">Superadmin</option></select>}{["ADVISEE", "ADVISOR"].map((capability) => <label key={capability} className="flex min-h-9 items-center gap-2 text-sm text-[#5e5368]"><Checkbox checked={person.capabilities.includes(capability)} onCheckedChange={(checked) => void onSetCapability(person, capability, checked === true)} className="size-5 data-checked:border-[#6d4a8b] data-checked:bg-[#6d4a8b]" />{capabilityNames[capability]}</label>)}<DirectoryProfileFields person={person} onSave={onEdit} /></div></details></td>
    <td className="px-4 py-4"><AccountState person={person} /></td><td className="px-4 py-4"><UserActions person={person} onEdit={onEdit} onResetPassword={onResetPassword} /></td>
  </tr>;
}

function PersonCard({ person, canAssignSystemRole, onEdit, onEditCid, onResetPassword, onSetCapability }: { person: Person; canAssignSystemRole: boolean; onEdit: (person: Person, changes: Record<string, unknown>) => Promise<Person>; onEditCid: () => void; onResetPassword: () => void; onSetCapability: (person: Person, capability: string, checked: boolean) => Promise<void> }) {
  return <Card className="rounded-[1.5rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025]"><CardContent className="p-4">
    <div className="flex items-start gap-3"><Avatar className="size-12 rounded-2xl"><AvatarImage src={person.avatarUrl ?? undefined} alt="" /><AvatarFallback className="rounded-2xl bg-[#f2edf7] font-semibold text-[#694786]">{(person.fullName ?? person.name).trim().slice(0, 1)}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate text-base font-semibold text-[#40344a]">{person.fullName ?? person.name}</span><span className="mt-1 block truncate text-sm text-[#817888]">{person.position || "ยังไม่ระบุตำแหน่ง"}{person.positionLevel ? ` · ${person.positionLevel}` : ""}</span></span><AccountState person={person} /></div>
    <div className="mt-3 flex flex-wrap gap-1.5">{person.systemRole !== "USER" && <Badge variant="outline" className="rounded-full border-[#e5d9ed] bg-[#f7f1fa] text-[#694786]">{systemRoleNames[person.systemRole] ?? person.systemRole}</Badge>}{person.capabilities.map((capability) => <Badge key={capability} variant="outline" className="rounded-full border-[#e1e7da] bg-[#f3f7ee] text-[#5a7439]">{capabilityNames[capability] ?? capability}</Badge>)}</div>
    <div className="mt-4 grid gap-2 rounded-xl bg-[#faf9fb] p-3 text-sm"><span className="flex items-center gap-2 text-[#655a70]"><Mail className="size-4 text-[#948b9b]" />{person.email || "ยังไม่ตั้งค่า Email"}</span><span className="flex items-center gap-2 text-[#655a70]"><KeyRound className="size-4 text-[#948b9b]" />{person.providerId || "ยังไม่เข้า ProviderID"}</span><span className="flex items-center gap-2 text-[#655a70]"><UserRound className="size-4 text-[#948b9b]" />{person.cidRegistered ? "CID ลงทะเบียนแล้ว" : "รอเพิ่ม CID"}</span></div>
    <details className="group mt-3"><summary className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-[#e9e4ed] px-3 text-sm font-semibold text-[#674382]">จัดการบัญชี<span className="text-[#938a9a] group-open:rotate-180">⌄</span></summary><div className="mt-2 space-y-3 rounded-xl border border-[#eeeaf2] p-3">{canAssignSystemRole && <Field label="สิทธิ์ระบบ"><select value={person.systemRole} onChange={(event) => void onEdit(person, { systemRole: event.target.value }).catch((error) => toast.error(error.message))} className="h-10 w-full rounded-lg border border-[#e7e1eb] bg-white px-2 text-sm"><option value="USER">ผู้ใช้ทั่วไป</option><option value="PM">PM</option><option value="SUPERADMIN">Superadmin</option></select></Field>}<div><p className="mb-1 text-sm font-semibold text-[#584c62]">โหมดที่อนุญาต</p>{["ADVISEE", "ADVISOR"].map((capability) => <label key={capability} className="flex min-h-9 items-center gap-2 text-sm text-[#5e5368]"><Checkbox checked={person.capabilities.includes(capability)} onCheckedChange={(checked) => void onSetCapability(person, capability, checked === true)} className="size-5 data-checked:border-[#6d4a8b] data-checked:bg-[#6d4a8b]" />{capabilityNames[capability]}</label>)}</div><DirectoryProfileFields person={person} onSave={onEdit} /></div></details>
    <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" onClick={onEditCid} className="h-10 rounded-xl text-sm">{person.cidRegistered ? "แก้ CID" : "เพิ่ม CID"}</Button><UserActions person={person} onEdit={onEdit} onResetPassword={onResetPassword} /></div>
  </CardContent></Card>;
}

function AccountState({ person }: { person: Person }) { return <Badge variant="outline" className={`shrink-0 rounded-full ${person.userId ? "border-[#dcebd1] bg-[#eff7e9] text-[#4e702f]" : "border-[#ede4d2] bg-[#fbf6ea] text-[#8e6b32]"}`}>{person.userId ? "เชื่อมแล้ว" : "รอเข้าใช้"}</Badge>; }

function UserActions({ person, onEdit, onResetPassword }: { person: Person; onEdit: (person: Person, changes: Record<string, unknown>) => Promise<Person>; onResetPassword: () => void }) {
  return <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void onEdit(person, { active: person.active === false }).catch((error) => toast.error(error.message))} className={`h-10 rounded-xl px-3 text-sm ${person.active === false ? "border-[#dcebd1] text-[#557832]" : "border-[#eeeaf2] text-[#6b6175]"}`}>{person.active === false ? "เปิดใช้" : "ปิดใช้"}</Button><Button variant="ghost" disabled={!person.userId || !person.email} onClick={onResetPassword} className="h-10 rounded-xl px-2 text-sm text-[#674382]">ออกรหัสผ่าน</Button></div>;
}

function DirectoryProfileFields({ person, onSave }: { person: Person; onSave: (person: Person, changes: Record<string, unknown>) => Promise<Person> }) {
  const [values, setValues] = useState({ email: person.email ?? "", position: person.position ?? "", positionLevel: person.positionLevel ?? "", mission: person.mission ?? "", workGroup: person.workGroup ?? "" });
  const [busy, setBusy] = useState(false);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true);
    try { const updated = await onSave(person, values); setValues({ email: updated.email ?? "", position: updated.position ?? "", positionLevel: updated.positionLevel ?? "", mission: updated.mission ?? "", workGroup: updated.workGroup ?? "" }); toast.success("บันทึกข้อมูลโปรไฟล์แล้ว"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ"); }
    finally { setBusy(false); }
  };
  return <form onSubmit={save} className="space-y-2 border-t border-[#eeeaf2] pt-3"><p className="text-sm font-semibold text-[#584c62]">ข้อมูลโปรไฟล์ที่ PM ดูแล</p>{(["email", "position", "positionLevel", "mission", "workGroup"] as const).map((field) => <label key={field} className="block space-y-1 text-sm text-[#72697b]">{({ email: "Email สำหรับเข้าสู่ระบบ", position: "ตำแหน่ง", positionLevel: "ระดับตำแหน่ง", mission: "ภารกิจ", workGroup: "กลุ่มงาน" })[field]}<Input type={field === "email" ? "email" : "text"} value={values[field]} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} className="h-10 rounded-lg text-sm" /></label>)}<Button type="submit" size="sm" disabled={busy} className="h-10 rounded-xl px-3">{busy ? "กำลังบันทึก…" : "บันทึกข้อมูล"}</Button></form>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`block min-w-0 space-y-2 text-sm font-semibold text-[#51465b] ${className}`}>{label}{children}</label>; }
