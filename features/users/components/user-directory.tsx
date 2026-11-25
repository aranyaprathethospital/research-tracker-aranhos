"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UserDirectoryPerson as Person } from "@/features/users/types";
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { Plus, Search, ShieldCheck, Users, X } from "lucide-react";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { inputClass, selectClass } from "./user-directory-fields";
import { type UserFormValues, type EditorMode } from "./user-form-schema";
import { UserEditorDialog } from "./user-editor-dialog";
import { CidEditorDialog } from "./user-cid-dialog";
import { ResetPasswordDialog } from "./user-password-dialog";
import { PersonTableRow, PersonCard } from "./user-directory-person";

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

export default function UserDirectory({
  people,
  onChange,
  canAssignSystemRole,
  currentProfileId,
}: UserDirectoryProps) {
  const [editor, setEditor] = useState<{
    mode: EditorMode;
    person?: Person;
    key: number;
  } | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [cidTarget, setCidTarget] = useState<Person | null>(null);
  const [resetTarget, setResetTarget] = useState<Person | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const filteredPeople = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return people.filter((person) => {
      const searchable = [
        person.fullName,
        person.name,
        person.email,
        person.providerId,
        person.position,
        person.positionLevel,
        person.mission,
        person.workGroup,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      const matchesQuery =
        !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && person.active !== false) ||
        (statusFilter === "INACTIVE" && person.active === false) ||
        (statusFilter === "PENDING" && !person.userId);
      const matchesRole =
        roleFilter === "ALL" ||
        person.systemRole === roleFilter ||
        person.capabilities.includes(roleFilter);
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [people, query, roleFilter, statusFilter]);
  const table = useLegacyTable<Person>({
    data: filteredPeople,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const openCreate = () => {
    setEditorKey((value) => value + 1);
    setEditor({ mode: "create", key: editorKey + 1 });
  };

  const openEdit = (person: Person) => {
    setEditorKey((value) => value + 1);
    setEditor({ mode: "edit", person, key: editorKey + 1 });
  };

  const savePerson = async (
    mode: EditorMode,
    person: Person | undefined,
    values: UserFormValues,
  ) => {
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
    const payload =
      mode === "create"
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
    const result = (await response.json().catch(() => null)) as {
      error?: string;
      person?: Person;
    } | null;
    if (!response.ok || !result?.person)
      throw new Error(
        result?.error ?? "บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง",
      );

    const savedPerson = result.person;
    onChange((current) =>
      mode === "create"
        ? [...current, savedPerson]
        : current.map((entry) =>
            entry.id === savedPerson.id ? { ...entry, ...savedPerson } : entry,
          ),
    );
    toast.success(
      mode === "create" ? "เพิ่มรายชื่อผู้ใช้แล้ว" : "บันทึกข้อมูลผู้ใช้แล้ว",
    );
  };

  const updateCid = async (person: Person, cid: string) => {
    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: person.id, cid }),
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
      person?: Person;
    } | null;
    if (!response.ok || !result?.person)
      throw new Error(result?.error ?? "บันทึก CID ไม่สำเร็จ กรุณาลองอีกครั้ง");
    onChange((current) =>
      current.map((entry) =>
        entry.id === person.id ? { ...entry, ...result.person } : entry,
      ),
    );
    toast.success("บันทึก CID แล้ว");
  };

  const issueTemporaryPassword = async (person: Person) => {
    const response = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: person.id }),
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
      temporaryPassword?: string;
    } | null;
    if (!response.ok || !result?.temporaryPassword)
      throw new Error(result?.error ?? "ออกรหัสผ่านชั่วคราวไม่สำเร็จ");
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
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f2edf7] px-3 py-1.5 text-xs font-bold tracking-wide text-[#6d4a8b]">
              <ShieldCheck className="size-4" />
              จัดการสิทธิ์เข้าใช้งาน
            </span>
            <CardTitle className="mt-3 text-lg font-semibold text-[#382d43] sm:text-xl">
              รายชื่อและบัญชีผู้ใช้
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl text-sm leading-6 text-[#817888] sm:text-[15px]">
              ลงทะเบียน CID ก่อนเข้า ProviderID · PM จัดการ Advisor/Advisee ·
              Superadmin จัดการสิทธิ์ระบบ
            </CardDescription>
          </div>
          <Button
            onClick={openCreate}
            className="h-11 w-full shrink-0 rounded-xl bg-[#65418a] px-4 text-sm font-semibold shadow-[0_8px_18px_rgba(101,65,138,.18)] transition hover:-translate-y-0.5 hover:bg-[#573576] sm:w-auto"
          >
            <Plus className="size-4" />
            เพิ่มผู้ใช้
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="grid gap-3 rounded-2xl border border-[#ece5f0] bg-[#f8f5fa] p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <label htmlFor="user-directory-search" className="mb-2 block text-sm font-semibold text-foreground">ค้นหารายชื่อผู้ใช้</label>
              <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#968c9e]" />
              <Input
                id="user-directory-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={`${inputClass} pl-10 pr-12`}
              />
              {query && (
                <button
                  type="button"
                  aria-label="ล้างคำค้นหา"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[#93899b] transition hover:bg-[#f3eff6] hover:text-[#5e4078]"
                >
                  <X className="size-4" />
                </button>
              )}
              </div>
            </div>
            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-foreground">สถานะบัญชี</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className={selectClass}
                aria-label="กรองสถานะบัญชี"
              >
                <option value="ALL">ทุกสถานะ · {statusCounts.ALL}</option>
                <option value="ACTIVE">
                  เปิดใช้งาน · {statusCounts.ACTIVE}
                </option>
                <option value="PENDING">
                  รอเชื่อมบัญชี · {statusCounts.PENDING}
                </option>
                <option value="INACTIVE">
                  ปิดใช้งาน · {statusCounts.INACTIVE}
                </option>
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-foreground">บทบาท</span>
              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as RoleFilter)
                }
                className={selectClass}
                aria-label="กรองบทบาทผู้ใช้"
              >
                <option value="ALL">ทุกบทบาท</option>
                <option value="USER">ผู้ใช้ทั่วไป</option>
                <option value="PM">PM</option>
                <option value="SUPERADMIN">Superadmin</option>
                <option value="ADVISEE">Advisee</option>
                <option value="ADVISOR">Advisor</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0edf3] pt-3">
            <p className="text-sm text-[#817888]">
              กำลังแสดง{" "}
              <span className="font-semibold tabular-nums text-[#493d54]">
                {filteredPeople.length}
              </span>{" "}
              จาก {people.length} รายชื่อ
            </p>
            {(query || statusFilter !== "ALL" || roleFilter !== "ALL") && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("ALL");
                  setRoleFilter("ALL");
                }}
                className="h-9 rounded-lg px-2.5 text-sm text-[#694786]"
              >
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredPeople.length === 0 ? (
        <Card className="rounded-[1.75rem] border-dashed border-[#dcd4e3] bg-white shadow-none">
          <CardContent className="px-5 py-12 text-center sm:py-16">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f2edf7] text-[#704b8d]">
              <Users className="size-6" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-[#463a50]">
              {people.length === 0
                ? "ยังไม่มีรายชื่อในระบบ"
                : "ไม่พบผู้ใช้ตามตัวกรอง"}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#817888]">
              {people.length === 0
                ? "เพิ่มผู้ใช้ด้วย CID และชื่อเต็ม เพื่อให้เข้าใช้งานด้วย ProviderID ได้"
                : "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง แล้วค้นหารายชื่ออีกครั้ง"}
            </p>
            {people.length === 0 ? (
              <Button
                onClick={openCreate}
                className="mt-5 h-11 rounded-xl px-4"
              >
                <Plus className="size-4" />
                เพิ่มผู้ใช้คนแรก
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("ALL");
                  setRoleFilter("ALL");
                }}
                className="mt-5 h-11 rounded-xl border-[#e6dfeb] px-4 text-[#60407b]"
              >
                ล้างตัวกรอง
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:hidden">
            {filteredPeople.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                canAssignSystemRole={canAssignSystemRole}
                currentProfileId={currentProfileId}
                onEdit={() => openEdit(person)}
                onEditCid={() => setCidTarget(person)}
                onResetPassword={() => setResetTarget(person)}
              />
            ))}
          </div>
          <Card className="hidden overflow-hidden rounded-[1.75rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025] xl:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left">
                <thead>
                  <tr>
                    {table.getHeaderGroups()[0]?.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="h-12 border-b border-[#eeeaf2] bg-[#faf9fb] px-4 text-[11px] font-bold uppercase tracking-[.12em] text-[#8b8292]"
                      >
                        {typeof header.column.columnDef.header === "string"
                          ? header.column.columnDef.header
                          : header.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <PersonTableRow
                      key={row.original.id}
                      person={row.original}
                      canAssignSystemRole={canAssignSystemRole}
                      currentProfileId={currentProfileId}
                      onEdit={() => openEdit(row.original)}
                      onEditCid={() => setCidTarget(row.original)}
                      onResetPassword={() => setResetTarget(row.original)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {editor && (
        <UserEditorDialog
          key={`${editor.mode}-${editor.person?.id ?? "new"}-${editor.key}`}
          mode={editor.mode}
          person={editor.person}
          canAssignSystemRole={canAssignSystemRole}
          onOpenChange={(open) => {
            if (!open) setEditor(null);
          }}
          onSave={savePerson}
        />
      )}
      {cidTarget && (
        <CidEditorDialog
          key={cidTarget.id}
          person={cidTarget}
          onOpenChange={(open) => {
            if (!open) setCidTarget(null);
          }}
          onSave={updateCid}
        />
      )}
      {resetTarget && (
        <ResetPasswordDialog
          key={resetTarget.id}
          person={resetTarget}
          onOpenChange={(open) => {
            if (!open) setResetTarget(null);
          }}
          onIssue={issueTemporaryPassword}
        />
      )}
    </div>
  );
}
