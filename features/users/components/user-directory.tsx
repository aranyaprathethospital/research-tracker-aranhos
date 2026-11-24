"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  BadgeCheck,
  Check,
  Clipboard,
  Copy,
  FilePenLine,
  IdCard,
  KeyRound,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { UserDirectoryPerson as Person } from "@/features/users/types";

const capabilityNames = { ADVISOR: "Advisor", ADVISEE: "Advisee" } as const;
const systemRoleNames: Record<string, string> = { USER: "ผู้ใช้ทั่วไป", PM: "PM", SUPERADMIN: "Superadmin" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roleValues = ["USER", "PM", "SUPERADMIN"] as const;
const capabilityValues = ["ADVISEE", "ADVISOR"] as const;
const inputClass = "h-11 rounded-xl border-[#e7e1eb] bg-white text-[15px] text-[#40364a] shadow-sm shadow-[#40304c]/[.02] placeholder:text-[#aaa2b0] focus-visible:border-[#9774b2] focus-visible:ring-[#9774b2]/20";
const selectClass = "h-11 w-full appearance-none rounded-xl border border-[#e7e1eb] bg-white px-3 text-sm font-medium text-[#40364a] shadow-sm shadow-[#40304c]/[.02] outline-none transition focus:border-[#9774b2] focus:ring-4 focus:ring-[#9774b2]/10";

const userFormSchema = z.object({
  fullName: z.string().trim().min(1, "กรอกชื่อและนามสกุล").max(160, "ชื่อยาวเกิน 160 ตัวอักษร"),
  cid: z.string().trim(),
  email: z.string().trim().max(254, "Email ยาวเกินกำหนด").refine((value) => !value || emailPattern.test(value), "รูปแบบ Email ไม่ถูกต้อง"),
  position: z.string().trim().max(160, "ข้อมูลยาวเกิน 160 ตัวอักษร"),
  positionLevel: z.string().trim().max(160, "ข้อมูลยาวเกิน 160 ตัวอักษร"),
  mission: z.string().trim().max(160, "ข้อมูลยาวเกิน 160 ตัวอักษร"),
  workGroup: z.string().trim().max(160, "ข้อมูลยาวเกิน 160 ตัวอักษร"),
  systemRole: z.enum(roleValues),
  capabilities: z.array(z.enum(capabilityValues)).max(2),
  active: z.boolean(),
}).superRefine((value, context) => {
  if (value.systemRole === "USER" && value.capabilities.length === 0) {
    context.addIssue({ code: "custom", path: ["capabilities"], message: "ผู้ใช้ทั่วไปต้องมีอย่างน้อยหนึ่งโหมด" });
  }
});

const cidFormSchema = z.object({
  cid: z.string().refine(isValidThaiCid, "กรุณาตรวจเลข CID 13 หลักอีกครั้ง"),
});

type UserFormValues = z.infer<typeof userFormSchema>;
type CidFormValues = z.infer<typeof cidFormSchema>;
type EditorMode = "create" | "edit";
type StatusFilter = "ALL" | "ACTIVE" | "PENDING" | "INACTIVE";
type RoleFilter = "ALL" | "USER" | "PM" | "SUPERADMIN" | "ADVISEE" | "ADVISOR";

type UserDirectoryProps = {
  people: Person[];
  onChange: Dispatch<SetStateAction<Person[]>>;
  canAssignSystemRole: boolean;
  currentProfileId: string;
};

const columns: LegacyColumnDef<Person>[] = [
  { accessorKey: "fullName", header: "ผู้ใช้" },
  { accessorKey: "email", header: "อีเมลสำรอง" },
  { accessorKey: "providerId", header: "ProviderID" },
  { accessorKey: "capabilities", header: "สิทธิ์" },
  { accessorKey: "active", header: "สถานะบัญชี" },
  { id: "actions", header: "จัดการ" },
];

export default function UserDirectory({ people, onChange, canAssignSystemRole, currentProfileId }: UserDirectoryProps) {
  const [editor, setEditor] = useState<{ mode: EditorMode; person?: Person; key: number } | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [cidTarget, setCidTarget] = useState<Person | null>(null);
  const [resetTarget, setResetTarget] = useState<Person | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const filteredPeople = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return people.filter((person) => {
      const searchable = [person.fullName, person.name, person.email, person.providerId, person.position, person.positionLevel, person.mission, person.workGroup]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "ACTIVE" && person.active !== false)
        || (statusFilter === "INACTIVE" && person.active === false)
        || (statusFilter === "PENDING" && !person.userId);
      const matchesRole = roleFilter === "ALL"
        || person.systemRole === roleFilter
        || person.capabilities.includes(roleFilter);
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [people, query, roleFilter, statusFilter]);
  const table = useLegacyTable<Person>({ data: filteredPeople, columns, getCoreRowModel: getCoreRowModel() });

  const openCreate = () => {
    setEditorKey((value) => value + 1);
    setEditor({ mode: "create", key: editorKey + 1 });
  };

  const openEdit = (person: Person) => {
    setEditorKey((value) => value + 1);
    setEditor({ mode: "edit", person, key: editorKey + 1 });
  };

  const savePerson = async (mode: EditorMode, person: Person | undefined, values: UserFormValues) => {
    const profileFields = {
      fullName: values.fullName,
      email: values.email,
      position: values.position,
      positionLevel: values.positionLevel,
      mission: values.mission,
      workGroup: values.workGroup,
      capabilities: values.capabilities,
      ...(canAssignSystemRole ? { systemRole: values.systemRole } : {}),
    };
    const payload = mode === "create"
      ? { ...profileFields, cid: values.cid }
      : {
          id: person?.id,
          ...profileFields,
          active: values.active,
          ...(values.email ? { email: values.email } : { email: undefined }),
        };
    const response = await fetch("/api/users", {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null) as { error?: string; person?: Person } | null;
    if (!response.ok || !result?.person) throw new Error(result?.error ?? "บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");

    const savedPerson = result.person;
    onChange((current) => mode === "create"
      ? [...current, savedPerson]
      : current.map((entry) => entry.id === savedPerson.id ? { ...entry, ...savedPerson } : entry));
    toast.success(mode === "create" ? "เพิ่มรายชื่อผู้ใช้แล้ว" : "บันทึกข้อมูลผู้ใช้แล้ว");
  };

  const updateCid = async (person: Person, cid: string) => {
    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: person.id, cid }),
    });
    const result = await response.json().catch(() => null) as { error?: string; person?: Person } | null;
    if (!response.ok || !result?.person) throw new Error(result?.error ?? "บันทึก CID ไม่สำเร็จ กรุณาลองอีกครั้ง");
    onChange((current) => current.map((entry) => entry.id === person.id ? { ...entry, ...result.person } : entry));
    toast.success("บันทึก CID แล้ว");
  };

  const issueTemporaryPassword = async (person: Person) => {
    const response = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: person.id }),
    });
    const result = await response.json().catch(() => null) as { error?: string; temporaryPassword?: string } | null;
    if (!response.ok || !result?.temporaryPassword) throw new Error(result?.error ?? "ออกรหัสผ่านชั่วคราวไม่สำเร็จ");
    return result.temporaryPassword;
  };

  const statusCounts = {
    ALL: people.length,
    ACTIVE: people.filter((person) => person.active !== false).length,
    PENDING: people.filter((person) => !person.userId).length,
    INACTIVE: people.filter((person) => person.active === false).length,
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="overflow-hidden rounded-[1.75rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025]">
        <CardHeader className="flex flex-col gap-4 px-4 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f2edf7] px-3 py-1.5 text-xs font-bold tracking-wide text-[#6d4a8b]"><ShieldCheck className="size-4" />จัดการสิทธิ์เข้าใช้งาน</span>
            <CardTitle className="mt-3 text-lg font-semibold text-[#382d43] sm:text-xl">รายชื่อและบัญชีผู้ใช้</CardTitle>
            <CardDescription className="mt-1 max-w-3xl text-sm leading-6 text-[#817888] sm:text-[15px]">ลงทะเบียน CID ก่อนเข้า ProviderID · PM จัดการ Advisor/Advisee · Superadmin จัดการสิทธิ์ระบบ</CardDescription>
          </div>
          <Button onClick={openCreate} className="h-11 w-full shrink-0 rounded-xl bg-[#65418a] px-4 text-sm font-semibold shadow-[0_8px_18px_rgba(101,65,138,.18)] transition hover:-translate-y-0.5 hover:bg-[#573576] sm:w-auto">
            <Plus className="size-4" />เพิ่มผู้ใช้
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_190px]">
            <label className="relative block min-w-0">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#968c9e]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ, Email, ProviderID หรือกลุ่มงาน" aria-label="ค้นหารายชื่อผู้ใช้" className={`${inputClass} pl-10`} />
              {query && <button type="button" aria-label="ล้างคำค้นหา" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[#93899b] transition hover:bg-[#f3eff6] hover:text-[#5e4078]"><X className="size-4" /></button>}
            </label>
            <label className="block min-w-0"><span className="sr-only">กรองสถานะ</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className={selectClass} aria-label="กรองสถานะบัญชี"><option value="ALL">ทุกสถานะ · {statusCounts.ALL}</option><option value="ACTIVE">เปิดใช้งาน · {statusCounts.ACTIVE}</option><option value="PENDING">รอเชื่อมบัญชี · {statusCounts.PENDING}</option><option value="INACTIVE">ปิดใช้งาน · {statusCounts.INACTIVE}</option></select></label>
            <label className="block min-w-0"><span className="sr-only">กรองบทบาท</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)} className={selectClass} aria-label="กรองบทบาทผู้ใช้"><option value="ALL">ทุกบทบาท</option><option value="USER">ผู้ใช้ทั่วไป</option><option value="PM">PM</option><option value="SUPERADMIN">Superadmin</option><option value="ADVISEE">Advisee</option><option value="ADVISOR">Advisor</option></select></label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0edf3] pt-3">
            <p className="text-sm text-[#817888]">กำลังแสดง <span className="font-semibold tabular-nums text-[#493d54]">{filteredPeople.length}</span> จาก {people.length} รายชื่อ</p>
            {(query || statusFilter !== "ALL" || roleFilter !== "ALL") && <Button type="button" variant="ghost" onClick={() => { setQuery(""); setStatusFilter("ALL"); setRoleFilter("ALL"); }} className="h-9 rounded-lg px-2.5 text-sm text-[#694786]">ล้างตัวกรอง</Button>}
          </div>
        </CardContent>
      </Card>

      {filteredPeople.length === 0 ? (
        <Card className="rounded-[1.75rem] border-dashed border-[#dcd4e3] bg-white shadow-none">
          <CardContent className="px-5 py-12 text-center sm:py-16">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f2edf7] text-[#704b8d]"><Users className="size-6" /></span>
            <h2 className="mt-4 text-base font-semibold text-[#463a50]">{people.length === 0 ? "ยังไม่มีรายชื่อในระบบ" : "ไม่พบผู้ใช้ตามตัวกรอง"}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#817888]">{people.length === 0 ? "เพิ่มผู้ใช้ด้วย CID และชื่อเต็ม เพื่อให้เข้าใช้งานด้วย ProviderID ได้" : "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง แล้วค้นหารายชื่ออีกครั้ง"}</p>
            {people.length === 0
              ? <Button onClick={openCreate} className="mt-5 h-11 rounded-xl px-4"><Plus className="size-4" />เพิ่มผู้ใช้คนแรก</Button>
              : <Button type="button" variant="outline" onClick={() => { setQuery(""); setStatusFilter("ALL"); setRoleFilter("ALL"); }} className="mt-5 h-11 rounded-xl border-[#e6dfeb] px-4 text-[#60407b]">ล้างตัวกรอง</Button>}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:hidden">
            {filteredPeople.map((person) => <PersonCard key={person.id} person={person} canAssignSystemRole={canAssignSystemRole} currentProfileId={currentProfileId} onEdit={() => openEdit(person)} onEditCid={() => setCidTarget(person)} onResetPassword={() => setResetTarget(person)} />)}
          </div>
          <Card className="hidden overflow-hidden rounded-[1.75rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025] xl:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left">
                <thead><tr>{table.getHeaderGroups()[0]?.headers.map((header) => <th key={header.id} scope="col" className="h-12 border-b border-[#eeeaf2] bg-[#faf9fb] px-4 text-[11px] font-bold uppercase tracking-[.12em] text-[#8b8292]">{typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : header.id}</th>)}</tr></thead>
                <tbody>{table.getRowModel().rows.map((row) => <PersonTableRow key={row.original.id} person={row.original} canAssignSystemRole={canAssignSystemRole} currentProfileId={currentProfileId} onEdit={() => openEdit(row.original)} onEditCid={() => setCidTarget(row.original)} onResetPassword={() => setResetTarget(row.original)} />)}</tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {editor && <UserEditorDialog key={`${editor.mode}-${editor.person?.id ?? "new"}-${editor.key}`} mode={editor.mode} person={editor.person} canAssignSystemRole={canAssignSystemRole} onOpenChange={(open) => { if (!open) setEditor(null); }} onSave={savePerson} />}
      {cidTarget && <CidEditorDialog key={cidTarget.id} person={cidTarget} onOpenChange={(open) => { if (!open) setCidTarget(null); }} onSave={updateCid} />}
      {resetTarget && <ResetPasswordDialog key={resetTarget.id} person={resetTarget} onOpenChange={(open) => { if (!open) setResetTarget(null); }} onIssue={issueTemporaryPassword} />}
    </div>
  );
}

function UserEditorDialog({
  mode,
  person,
  canAssignSystemRole,
  onOpenChange,
  onSave,
}: {
  mode: EditorMode;
  person?: Person;
  canAssignSystemRole: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (mode: EditorMode, person: Person | undefined, values: UserFormValues) => Promise<void>;
}) {
  const [saveError, setSaveError] = useState("");
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: person?.fullName ?? person?.name ?? "",
      cid: "",
      email: person?.email ?? "",
      position: person?.position ?? "",
      positionLevel: person?.positionLevel ?? "",
      mission: person?.mission ?? "",
      workGroup: person?.workGroup ?? "",
      systemRole: (person?.systemRole as UserFormValues["systemRole"] | undefined) ?? "USER",
      capabilities: person?.capabilities.filter((capability): capability is UserFormValues["capabilities"][number] => capability === "ADVISEE" || capability === "ADVISOR") ?? ["ADVISEE"],
      active: person?.active !== false,
    },
  });
  const capabilities = useWatch({ control: form.control, name: "capabilities" });
  const systemRole = useWatch({ control: form.control, name: "systemRole" });
  const active = useWatch({ control: form.control, name: "active" });
  const isSaving = form.formState.isSubmitting;

  const submit = form.handleSubmit(async (values) => {
    setSaveError("");
    if (mode === "create" && !isValidThaiCid(values.cid)) {
      form.setError("cid", { type: "validate", message: "กรุณากรอก CID 13 หลักให้ถูกต้อง" });
      return;
    }
    try {
      await onSave(mode, person, values);
      onOpenChange(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="grid max-h-[92svh] w-[calc(100%-1rem)] max-w-3xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-[1.75rem] border border-[#e9e1ee] bg-white p-0 text-[#40364a] shadow-[0_28px_100px_rgba(47,29,62,.25)] sm:w-[calc(100%-3rem)]">
        <div className="relative shrink-0 overflow-hidden border-b border-[#eee8f2] bg-[linear-gradient(125deg,#fbf8fd_0%,#ffffff_55%,#f5f8f0_100%)] px-5 py-5 pr-14 sm:px-7 sm:py-6 sm:pr-16">
          <div className="pointer-events-none absolute -right-10 -top-16 size-44 rounded-full bg-[#e7d9f1]/60 blur-3xl" />
          <DialogClose aria-label="ปิดหน้าต่าง" className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl border border-[#e8e1ec] bg-white/90 text-[#817888] shadow-sm transition hover:bg-[#f6f1f9] hover:text-[#5d3d79] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15">
            <X className="size-4" />
            <span className="sr-only">ปิดหน้าต่าง</span>
          </DialogClose>
          <DialogHeader className="relative gap-2 text-left">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#6c4889] text-white shadow-[0_8px_20px_rgba(108,72,137,.22)]"><Sparkles className="size-5" /></span>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-semibold tracking-tight text-[#382d43] sm:text-2xl">{mode === "create" ? "เพิ่มผู้ใช้ใหม่" : "แก้ไขข้อมูลผู้ใช้"}</DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-5 text-[#817888]">{mode === "create" ? "ลงทะเบียน CID และกำหนดสิทธิ์ก่อนให้เข้า ProviderID" : `จัดการข้อมูลและสิทธิ์ของ ${person?.fullName ?? person?.name ?? "ผู้ใช้"}`}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            {saveError && <div role="alert" className="flex gap-3 rounded-2xl border border-[#f0d2cf] bg-[#fff5f3] px-4 py-3 text-sm leading-6 text-[#994d45]"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-[#fde7e3]"><span className="text-base font-bold">!</span></span><p>{saveError}</p></div>}

            <section className="space-y-3">
              <SectionHeading number="01" title="ข้อมูลประจำตัว" detail="ชื่อและข้อมูลที่ใช้ระบุตัวตนในระบบ" />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="ชื่อและนามสกุล" error={form.formState.errors.fullName?.message} className="sm:col-span-2">
                  <Input autoComplete="name" placeholder="เช่น กานต์ชนก ใจดี" {...form.register("fullName")} className={inputClass} />
                </FormField>
                {mode === "create" && <FormField label="เลข CID 13 หลัก" hint="ระบบจะเก็บเป็นรหัสตรวจสอบ ไม่เก็บเลขดิบ" error={form.formState.errors.cid?.message} className="sm:col-span-2">
                  <Input inputMode="numeric" autoComplete="off" maxLength={13} placeholder="กรอกเลขบัตรประชาชน 13 หลัก" {...form.register("cid", { onChange: (event) => { event.target.value = event.target.value.replace(/\D/g, "").slice(0, 13); } })} className={inputClass} />
                </FormField>}
                <FormField label="Email สำหรับเข้าสู่ระบบสำรอง" hint={mode === "create" ? "ไม่ใส่ตอนนี้ก็ได้ ตั้งค่าได้ภายหลัง" : "เปลี่ยน Email แล้วระบบจะยกเลิกการยืนยัน Email เดิม"} error={form.formState.errors.email?.message} className="sm:col-span-2">
                  <Input type="email" autoComplete="email" placeholder="name@example.com" {...form.register("email")} className={inputClass} />
                </FormField>
              </div>
            </section>

            <section className="space-y-3 border-t border-[#f0edf3] pt-5">
              <SectionHeading number="02" title="ข้อมูลการทำงาน" detail="รายละเอียดที่แสดงในทีมและหน้าโปรไฟล์" />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="ตำแหน่ง" error={form.formState.errors.position?.message}><Input placeholder="เช่น นักวิชาการสาธารณสุข" {...form.register("position")} className={inputClass} /></FormField>
                <FormField label="ระดับตำแหน่ง" error={form.formState.errors.positionLevel?.message}><Input placeholder="เช่น ชำนาญการ" {...form.register("positionLevel")} className={inputClass} /></FormField>
                <FormField label="ภารกิจ" error={form.formState.errors.mission?.message}><Input placeholder="เช่น วิจัยและประเมินผล" {...form.register("mission")} className={inputClass} /></FormField>
                <FormField label="กลุ่มงาน" error={form.formState.errors.workGroup?.message}><Input placeholder="เช่น กลุ่มงานพัฒนายุทธศาสตร์" {...form.register("workGroup")} className={inputClass} /></FormField>
              </div>
              {mode === "edit" && person?.signatureUrl && <a href={person.signatureUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl border border-[#e9e2ed] bg-white px-3 text-sm font-semibold text-[#684783] transition hover:bg-[#faf7fc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15">เปิดดูลายเซ็นที่บันทึกไว้</a>}
            </section>

            <section className="space-y-3 border-t border-[#f0edf3] pt-5">
              <SectionHeading number="03" title="สิทธิ์และการเข้าใช้งาน" detail="System role คุมการจัดการระบบ · โหมดกำหนดมุมมอง Advisor/Advisee" />
              <div className={`grid gap-4 ${canAssignSystemRole ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
                {canAssignSystemRole && <FormField label="บทบาทระบบ" error={form.formState.errors.systemRole?.message}>
                  <select {...form.register("systemRole")} className={selectClass}>
                    <option value="USER">ผู้ใช้ทั่วไป</option>
                    <option value="PM">PM · ผู้จัดการโครงการ</option>
                    <option value="SUPERADMIN">Superadmin · ผู้ดูแลสูงสุด</option>
                  </select>
                </FormField>}
                <fieldset className="min-w-0 rounded-2xl border border-[#e9e4ed] bg-[#fcfbfd] p-3.5 sm:p-4">
                  <legend className="px-1 text-sm font-semibold text-[#51465b]">โหมดที่อนุญาต</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {capabilityValues.map((capability) => {
                      const checked = capabilities.includes(capability);
                      return <label key={capability} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 transition ${checked ? "border-[#d8c7e5] bg-[#f8f3fb]" : "border-[#eeeaf1] bg-white hover:border-[#e2d7ea]"}`}>
                        <Checkbox checked={checked} onCheckedChange={(value) => {
                          const next = value === true ? [...capabilities, capability] : capabilities.filter((item) => item !== capability);
                          form.setValue("capabilities", next, { shouldDirty: true, shouldValidate: true });
                        }} aria-label={`อนุญาตโหมด ${capabilityNames[capability]}`} className="size-5 data-checked:border-[#6d4a8b] data-checked:bg-[#6d4a8b]" />
                        <span className="min-w-0"><span className="block text-sm font-semibold text-[#4e4358]">{capabilityNames[capability]}</span><span className="block text-xs text-[#8b8292]">{capability === "ADVISEE" ? "ผู้ทำวิจัย" : "อาจารย์ที่ปรึกษา"}</span></span>
                        {checked && <Check className="ml-auto size-4 text-[#6d4a8b]" />}
                      </label>;
                    })}
                  </div>
                  {form.formState.errors.capabilities?.message && <p className="mt-2 text-xs font-medium text-[#a44e43]">{form.formState.errors.capabilities.message}</p>}
                </fieldset>
              </div>
              {mode === "edit" && <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e9e4ed] bg-white px-4 py-3.5 transition hover:border-[#ded2e7]">
                <Checkbox checked={active} onCheckedChange={(value) => form.setValue("active", value === true, { shouldDirty: true })} aria-label="เปิดใช้งานบัญชีนี้" className="size-5 data-checked:border-[#6d4a8b] data-checked:bg-[#6d4a8b]" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#4e4358]">เปิดใช้งานบัญชี</span><span className="mt-0.5 block text-xs leading-5 text-[#8b8292]">เมื่อปิดใช้ ระบบจะยกเลิก session ทั้งหมด หากมีโครงการผูกอยู่ต้องย้ายผู้รับผิดชอบก่อน</span></span>
                <Badge variant="outline" className={`shrink-0 rounded-full ${active ? "border-[#dcebd1] bg-[#eff7e9] text-[#4e702f]" : "border-[#f0d2cf] bg-[#fff3f1] text-[#a44e43]"}`}>{active ? "ใช้งาน" : "ปิดใช้"}</Badge>
              </label>}
              {systemRole !== "USER" && <p className="rounded-xl bg-[#f8f5fa] px-3.5 py-3 text-xs leading-5 text-[#75697f]">บัญชีผู้ดูแลระบบจัดการ Workspace ได้ตามบทบาท แม้ไม่ได้เลือกโหมด Advisor หรือ Advisee</p>}
            </section>
          </div>

          <div className="shrink-0 border-t border-[#eee9f1] bg-white px-5 py-3.5 sm:flex sm:items-center sm:justify-between sm:px-7">
            <p className="hidden items-center gap-2 text-xs leading-5 text-[#938a9a] sm:flex"><ShieldCheck className="size-4 shrink-0 text-[#78964d]" />ข้อมูล CID จะไม่ถูกแสดงซ้ำหลังบันทึก</p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-xl border-[#e6dfeb] px-4 text-[#62576d]">ยกเลิก</Button>
              <Button type="submit" disabled={isSaving} className="h-11 min-w-32 rounded-xl bg-[#65418a] px-4 font-semibold shadow-[0_7px_16px_rgba(101,65,138,.15)] hover:bg-[#573576]">{isSaving ? "กำลังบันทึก…" : mode === "create" ? <><Plus className="size-4" />เพิ่มผู้ใช้</> : <><BadgeCheck className="size-4" />บันทึกข้อมูล</>}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CidEditorDialog({ person, onOpenChange, onSave }: { person: Person; onOpenChange: (open: boolean) => void; onSave: (person: Person, cid: string) => Promise<void> }) {
  const [saveError, setSaveError] = useState("");
  const form = useForm<CidFormValues>({ resolver: zodResolver(cidFormSchema), defaultValues: { cid: "" } });
  const submit = form.handleSubmit(async ({ cid }) => {
    setSaveError("");
    try {
      await onSave(person, cid);
      onOpenChange(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "บันทึก CID ไม่สำเร็จ");
    }
  });

  return <Dialog open onOpenChange={onOpenChange}>
    <DialogContent showCloseButton={false} className="w-[calc(100%-1rem)] max-w-lg rounded-[1.75rem] border border-[#e9e1ee] bg-white p-0 text-[#40364a] shadow-[0_28px_100px_rgba(47,29,62,.25)] sm:w-[calc(100%-3rem)]">
      <div className="relative overflow-hidden rounded-t-[1.75rem] border-b border-[#eee8f2] bg-[linear-gradient(125deg,#fbf8fd_0%,#ffffff_55%,#f5f8f0_100%)] px-5 py-5 pr-14 sm:px-6 sm:py-6 sm:pr-16">
        <DialogClose aria-label="ปิดหน้าต่าง" className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl border border-[#e8e1ec] bg-white/90 text-[#817888] shadow-sm transition hover:bg-[#f6f1f9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"><X className="size-4" /></DialogClose>
        <DialogHeader className="text-left"><span className="grid size-11 place-items-center rounded-2xl bg-[#6c4889] text-white shadow-[0_8px_20px_rgba(108,72,137,.22)]"><IdCard className="size-5" /></span><DialogTitle className="pt-1 text-xl font-semibold text-[#382d43]">{person.cidRegistered ? "แก้ไข CID" : "เพิ่ม CID"}</DialogTitle><DialogDescription className="text-sm leading-6 text-[#817888]">ลงทะเบียน CID สำหรับ <span className="font-semibold text-[#5c4a68]">{person.fullName ?? person.name}</span> เพื่อให้ระบบจับคู่ ProviderID ได้</DialogDescription></DialogHeader>
      </div>
      <form onSubmit={submit} noValidate className="space-y-4 px-5 py-5 sm:px-6">
        {saveError && <p role="alert" className="rounded-xl border border-[#f0d2cf] bg-[#fff5f3] px-3.5 py-3 text-sm leading-5 text-[#994d45]">{saveError}</p>}
        <FormField label="เลขประจำตัวประชาชน 13 หลัก" hint="ระบบตรวจ checksum ก่อนบันทึก และจะไม่แสดงเลขนี้ซ้ำ" error={form.formState.errors.cid?.message}>
          <Input inputMode="numeric" autoComplete="off" maxLength={13} placeholder="กรอกตัวเลข 13 หลัก" {...form.register("cid", { onChange: (event) => { event.target.value = event.target.value.replace(/\D/g, "").slice(0, 13); } })} className={`${inputClass} tracking-[.12em]`} />
        </FormField>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-xl border-[#e6dfeb]">ยกเลิก</Button>
          <Button type="submit" disabled={form.formState.isSubmitting} className="h-11 rounded-xl bg-[#65418a] px-4 hover:bg-[#573576]">{form.formState.isSubmitting ? "กำลังบันทึก…" : <><BadgeCheck className="size-4" />บันทึก CID</>}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}

function ResetPasswordDialog({ person, onOpenChange, onIssue }: { person: Person; onOpenChange: (open: boolean) => void; onIssue: (person: Person) => Promise<string> }) {
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const issue = async () => {
    setBusy(true);
    setError("");
    try {
      setTemporaryPassword(await onIssue(person));
      toast.success("ออกรหัสผ่านชั่วคราวแล้ว");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ออกรหัสผ่านชั่วคราวไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      toast.success("คัดลอกรหัสผ่านแล้ว");
    } catch {
      toast.error("คัดลอกไม่ได้ กรุณาเลือกรหัสผ่านแล้วคัดลอกด้วยตนเอง");
    }
  };

  return <Dialog open onOpenChange={onOpenChange}>
    <DialogContent showCloseButton={false} className="w-[calc(100%-1rem)] max-w-lg rounded-[1.75rem] border border-[#e9e1ee] bg-white p-0 text-[#40364a] shadow-[0_28px_100px_rgba(47,29,62,.25)] sm:w-[calc(100%-3rem)]">
      <div className="relative overflow-hidden rounded-t-[1.75rem] border-b border-[#eee8f2] bg-[linear-gradient(125deg,#fbf8fd_0%,#ffffff_55%,#f5f8f0_100%)] px-5 py-5 pr-14 sm:px-6 sm:py-6 sm:pr-16">
        <DialogClose aria-label="ปิดหน้าต่าง" className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl border border-[#e8e1ec] bg-white/90 text-[#817888] shadow-sm transition hover:bg-[#f6f1f9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"><X className="size-4" /></DialogClose>
        <DialogHeader className="text-left"><span className={`grid size-11 place-items-center rounded-2xl ${temporaryPassword ? "bg-[#64853d]" : "bg-[#6c4889]"} text-white shadow-[0_8px_20px_rgba(108,72,137,.22)]`}>{temporaryPassword ? <Check className="size-5" /> : <KeyRound className="size-5" />}</span><DialogTitle className="pt-1 text-xl font-semibold text-[#382d43]">{temporaryPassword ? "รหัสผ่านชั่วคราวพร้อมใช้" : "ออกรหัสผ่านชั่วคราว"}</DialogTitle><DialogDescription className="text-sm leading-6 text-[#817888]">บัญชีของ <span className="font-semibold text-[#5c4a68]">{person.fullName ?? person.name}</span></DialogDescription></DialogHeader>
      </div>
      <div className="space-y-4 px-5 py-5 sm:px-6">
        {temporaryPassword ? <>
          <div className="rounded-2xl border border-[#dfe9d4] bg-[#f6faF2] p-4">
            <p className="text-sm font-semibold text-[#4f6837]">รหัสผ่านครั้งเดียว</p>
            <p className="mt-1 text-xs leading-5 text-[#718260]">ส่งรหัสนี้ให้ผู้ใช้โดยตรง ผู้ใช้จะต้องตั้งรหัสใหม่หลังเข้าสู่ระบบ และ session เดิมถูกยกเลิกแล้ว</p>
            <div className="mt-3 flex gap-2">
              <Input readOnly value={temporaryPassword} aria-label="รหัสผ่านชั่วคราว" className="h-12 border-[#dce7d2] bg-white font-mono text-lg font-semibold tracking-[.16em] text-[#354529]" onFocus={(event) => event.currentTarget.select()} />
              <Button type="button" onClick={() => void copyPassword()} className="h-12 shrink-0 rounded-xl bg-[#64853d] px-3.5 text-white hover:bg-[#557332]">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}<span className="sr-only">คัดลอกรหัสผ่าน</span></Button>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-[#eeeaf1] px-3.5 py-3 text-xs leading-5 text-[#83798b]"><Clipboard className="mt-0.5 size-4 shrink-0 text-[#8c7a9c]" />ปิดหน้าต่างแล้วรหัสจะไม่แสดงอีก หากทำหายให้ออกรหัสผ่านใหม่</div>
          <div className="flex justify-end"><Button type="button" onClick={() => onOpenChange(false)} className="h-11 w-full rounded-xl bg-[#65418a] hover:bg-[#573576] sm:w-auto">เรียบร้อย</Button></div>
        </> : <>
          {error && <p role="alert" className="rounded-xl border border-[#f0d2cf] bg-[#fff5f3] px-3.5 py-3 text-sm leading-5 text-[#994d45]">{error}</p>}
          <div className="rounded-2xl border border-[#eee8f2] bg-[#fbf9fc] p-4">
            <p className="text-sm font-semibold text-[#50445a]">สิ่งที่จะเกิดขึ้น</p>
            <ul className="mt-2 space-y-2 text-sm leading-5 text-[#786e81]">
              <li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#8c6aa6]" />สร้างรหัสผ่านชั่วคราว 6 หลักให้คัดลอกส่งต่อ</li>
              <li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#8c6aa6]" />ออกจากระบบทุกอุปกรณ์ของผู้ใช้ทันที</li>
              <li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#8c6aa6]" />บังคับให้ตั้งรหัสใหม่หลังเข้าสู่ระบบ</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-xl border-[#e6dfeb]">ยกเลิก</Button>
            <Button type="button" disabled={busy} onClick={() => void issue()} className="h-11 rounded-xl bg-[#65418a] px-4 hover:bg-[#573576]">{busy ? "กำลังออกรหัส…" : <><KeyRound className="size-4" />ออกรหัสผ่าน</>}</Button>
          </div>
        </>}
      </div>
    </DialogContent>
  </Dialog>;
}

function PersonTableRow({ person, canAssignSystemRole, currentProfileId, onEdit, onEditCid, onResetPassword }: { person: Person; canAssignSystemRole: boolean; currentProfileId: string; onEdit: () => void; onEditCid: () => void; onResetPassword: () => void }) {
  return <tr className="border-b border-[#f0edf3] align-middle transition last:border-0 hover:bg-[#fcfbfd]">
    <td className="px-4 py-4"><PersonIdentity person={person} compact={false} /></td>
    <td className="px-4 py-4"><span className="block max-w-52 truncate text-sm text-[#675d71]">{person.email || "ยังไม่ตั้งค่า"}</span><span className="mt-1 block max-w-52 truncate text-xs text-[#a097a7]">{person.workGroup || person.mission || "ข้อมูลสำรอง"}</span></td>
    <td className="px-4 py-4"><span className="block max-w-44 truncate text-sm text-[#675d71]">{person.providerId || "ยังไม่เชื่อม"}</span><span className="mt-1 inline-flex items-center gap-1 text-xs text-[#928999]">{person.cidRegistered ? <><BadgeCheck className="size-3.5 text-[#718f4c]" />มี CID</> : "รอเพิ่ม CID"}</span></td>
    <td className="max-w-56 px-4 py-4"><PersonRoles person={person} /></td>
    <td className="px-4 py-4"><AccountState person={person} /></td>
    <td className="px-4 py-4"><PersonActions person={person} canAssignSystemRole={canAssignSystemRole} currentProfileId={currentProfileId} onEdit={onEdit} onEditCid={onEditCid} onResetPassword={onResetPassword} compact={false} /></td>
  </tr>;
}

function PersonCard({ person, canAssignSystemRole, currentProfileId, onEdit, onEditCid, onResetPassword }: { person: Person; canAssignSystemRole: boolean; currentProfileId: string; onEdit: () => void; onEditCid: () => void; onResetPassword: () => void }) {
  return <Card className="rounded-[1.5rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025] transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#40304c]/[.05] motion-reduce:transition-none">
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3"><PersonIdentity person={person} compact /><AccountState person={person} /></div>
      <PersonRoles person={person} />
      <div className="mt-3 grid gap-2 rounded-2xl border border-[#f0edf3] bg-[#fbfafc] p-3 text-sm">
        <span className="flex min-w-0 items-center gap-2 text-[#655a70]"><Mail className="size-4 shrink-0 text-[#948b9b]" /><span className="truncate">{person.email || "ยังไม่ตั้งค่า Email"}</span></span>
        <span className="flex min-w-0 items-center gap-2 text-[#655a70]"><KeyRound className="size-4 shrink-0 text-[#948b9b]" /><span className="truncate">{person.providerId || "ยังไม่เข้า ProviderID"}</span></span>
      </div>
      <PersonActions person={person} canAssignSystemRole={canAssignSystemRole} currentProfileId={currentProfileId} onEdit={onEdit} onEditCid={onEditCid} onResetPassword={onResetPassword} compact />
    </CardContent>
  </Card>;
}

function PersonIdentity({ person, compact }: { person: Person; compact: boolean }) {
  return <div className="flex min-w-0 items-center gap-3">
    <Avatar className={`${compact ? "size-11 rounded-2xl" : "size-10 rounded-xl"} shrink-0 ring-1 ring-[#ece6f0]`}>
      <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
      <AvatarFallback className={`${compact ? "rounded-2xl" : "rounded-xl"} bg-[#f2edf7] font-semibold text-[#694786]`}>{(person.fullName ?? person.name).trim().slice(0, 1) || "?"}</AvatarFallback>
    </Avatar>
    <span className="min-w-0">
      <span className={`block truncate font-semibold text-[#40344a] ${compact ? "text-sm sm:text-base" : "max-w-52 text-sm"}`}>{person.fullName ?? person.name}</span>
      <span className="mt-1 block truncate text-xs text-[#8b8292]">{[person.position, person.positionLevel].filter(Boolean).join(" · ") || "ยังไม่ระบุตำแหน่ง"}</span>
      {compact && <span className="mt-1 block truncate text-xs text-[#a097a7]">{person.workGroup || person.mission || "ยังไม่ระบุกลุ่มงาน"}</span>}
    </span>
  </div>;
}

function PersonRoles({ person }: { person: Person }) {
  return <div className="flex flex-wrap gap-1.5">
    {person.systemRole !== "USER" && <Badge variant="outline" className="rounded-full border-[#e5d9ed] bg-[#f7f1fa] text-[#694786]">{systemRoleNames[person.systemRole] ?? person.systemRole}</Badge>}
    {person.capabilities.map((capability) => <Badge key={capability} variant="outline" className="rounded-full border-[#e1e7da] bg-[#f3f7ee] text-[#5a7439]">{capabilityNames[capability as keyof typeof capabilityNames] ?? capability}</Badge>)}
    {person.systemRole === "USER" && person.capabilities.length === 0 && <Badge variant="outline" className="rounded-full border-[#f0d2cf] bg-[#fff5f3] text-[#994d45]">ยังไม่กำหนดสิทธิ์</Badge>}
  </div>;
}

function AccountState({ person }: { person: Person }) {
  const label = person.active === false ? "ปิดใช้งาน" : person.userId ? "เชื่อมแล้ว" : "รอเข้าใช้";
  const tone = person.active === false ? "border-[#f0d2cf] bg-[#fff3f1] text-[#a44e43]" : person.userId ? "border-[#dcebd1] bg-[#eff7e9] text-[#4e702f]" : "border-[#ede4d2] bg-[#fbf6ea] text-[#8e6b32]";
  return <Badge variant="outline" className={`shrink-0 rounded-full ${tone}`}>{label}</Badge>;
}

function PersonActions({ person, canAssignSystemRole, currentProfileId, onEdit, onEditCid, onResetPassword, compact }: { person: Person; canAssignSystemRole: boolean; currentProfileId: string; onEdit: () => void; onEditCid: () => void; onResetPassword: () => void; compact: boolean }) {
  const canManageTarget = canAssignSystemRole || person.systemRole === "USER";
  const canResetPassword = canManageTarget && person.id !== currentProfileId && Boolean(person.userId && person.email) && person.active !== false;
  const resetHint = person.id === currentProfileId
    ? "เปลี่ยนรหัสผ่านของตนเองได้ที่หน้าโปรไฟล์"
    : !canManageTarget
      ? "PM จัดการบัญชี PM/Superadmin ไม่ได้"
      : !person.userId
        ? "รอผู้ใช้เข้า ProviderID ครั้งแรก"
        : !person.email
          ? "ต้องมี Email สำหรับเข้าสู่ระบบ"
          : person.active === false
            ? "เปิดใช้งานบัญชีก่อนออกรหัสผ่าน"
            : undefined;
  return <div className={`mt-4 grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-3"}`}>
    <Button type="button" variant="outline" disabled={!canManageTarget} onClick={onEdit} title={!canManageTarget ? "เฉพาะ Superadmin จัดการบัญชี PM/Superadmin ได้" : undefined} className="h-10 min-w-0 rounded-xl border-[#e8e1ed] px-2.5 text-xs font-semibold text-[#5d4475] hover:bg-[#faf7fc] disabled:opacity-50 sm:text-sm"><FilePenLine className="size-4 shrink-0" />แก้ไข</Button>
    <Button type="button" variant="outline" disabled={Boolean(person.userId) || !canManageTarget} onClick={onEditCid} title={person.userId ? "บัญชีเชื่อม ProviderID แล้ว ไม่สามารถเปลี่ยน CID ได้" : !canManageTarget ? "เฉพาะ Superadmin จัดการบัญชี PM/Superadmin ได้" : undefined} className="h-10 min-w-0 rounded-xl border-[#e8e1ed] px-2.5 text-xs font-semibold text-[#5d4475] hover:bg-[#faf7fc] disabled:opacity-50 sm:text-sm"><IdCard className="size-4 shrink-0" />{person.cidRegistered ? "แก้ CID" : "เพิ่ม CID"}</Button>
    <Button type="button" variant="ghost" disabled={!canResetPassword} onClick={onResetPassword} title={resetHint} className={`${compact ? "col-span-2" : "col-span-3 xl:col-span-1"} h-10 min-w-0 rounded-xl px-2.5 text-xs font-semibold text-[#684783] hover:bg-[#f7f3fa] disabled:opacity-45 sm:text-sm`}><KeyRound className="size-4 shrink-0" />ออกรหัสผ่าน</Button>
  </div>;
}

function SectionHeading({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="flex items-start gap-3">
    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#f3eef7] text-[11px] font-bold tracking-wide text-[#6d4a8b]">{number}</span>
    <span className="min-w-0"><span className="block text-sm font-semibold text-[#4b4055]">{title}</span><span className="mt-0.5 block text-xs leading-5 text-[#8b8292]">{detail}</span></span>
  </div>;
}

function FormField({ label, hint, error, children, className = "" }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return <label className={`block min-w-0 space-y-1.5 text-sm font-semibold text-[#51465b] ${className}`}>
    <span className="block">{label}</span>
    {children}
    {error ? <span className="block text-xs font-medium leading-5 text-[#a44e43]">{error}</span> : hint ? <span className="block text-xs font-normal leading-5 text-[#948b9b]">{hint}</span> : null}
  </label>;
}

function isValidThaiCid(value: string) {
  if (!/^\d{13}$/.test(value)) return false;
  const total = [...value.slice(0, 12)].reduce((sum, digit, index) => sum + Number(digit) * (13 - index), 0);
  return (11 - total % 11) % 10 === Number(value[12]);
}
