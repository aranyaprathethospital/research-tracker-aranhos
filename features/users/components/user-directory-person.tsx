import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UserDirectoryPerson as Person } from "@/features/users/types";
import { BadgeCheck, FilePenLine, IdCard, KeyRound, Mail } from "lucide-react";
import { capabilityNames, systemRoleNames } from "./user-directory-fields";

export function PersonTableRow({
  person,
  canAssignSystemRole,
  currentProfileId,
  onEdit,
  onEditCid,
  onResetPassword,
}: {
  person: Person;
  canAssignSystemRole: boolean;
  currentProfileId: string;
  onEdit: () => void;
  onEditCid: () => void;
  onResetPassword: () => void;
}) {
  return (
    <tr className="border-b border-[#f0edf3] align-middle transition last:border-0 hover:bg-[#fcfbfd]">
      <td className="px-4 py-4">
        <PersonIdentity person={person} compact={false} />
      </td>
      <td className="px-4 py-4">
        <span className="block max-w-52 truncate text-sm text-[#675d71]">
          {person.email || "ยังไม่ตั้งค่า"}
        </span>
        <span className="mt-1 block max-w-52 truncate text-xs text-[#a097a7]">
          {person.workGroup || person.mission || "ข้อมูลสำรอง"}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className="block max-w-44 truncate text-sm text-[#675d71]">
          {person.providerId || "ยังไม่เชื่อม"}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-[#928999]">
          {person.cidRegistered ? (
            <>
              <BadgeCheck className="size-3.5 text-[#718f4c]" />
              มี CID
            </>
          ) : (
            "รอเพิ่ม CID"
          )}
        </span>
      </td>
      <td className="max-w-56 px-4 py-4">
        <PersonRoles person={person} />
      </td>
      <td className="px-4 py-4">
        <AccountState person={person} />
      </td>
      <td className="px-4 py-4">
        <PersonActions
          person={person}
          canAssignSystemRole={canAssignSystemRole}
          currentProfileId={currentProfileId}
          onEdit={onEdit}
          onEditCid={onEditCid}
          onResetPassword={onResetPassword}
          compact={false}
        />
      </td>
    </tr>
  );
}

export function PersonCard({
  person,
  canAssignSystemRole,
  currentProfileId,
  onEdit,
  onEditCid,
  onResetPassword,
}: {
  person: Person;
  canAssignSystemRole: boolean;
  currentProfileId: string;
  onEdit: () => void;
  onEditCid: () => void;
  onResetPassword: () => void;
}) {
  return (
    <Card className="rounded-[1.5rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025] transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#40304c]/[.05] motion-reduce:transition-none">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <PersonIdentity person={person} compact />
          <AccountState person={person} />
        </div>
        <PersonRoles person={person} />
        <div className="mt-3 grid gap-2 rounded-2xl border border-[#f0edf3] bg-[#fbfafc] p-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-[#655a70]">
            <Mail className="size-4 shrink-0 text-[#948b9b]" />
            <span className="truncate">
              {person.email || "ยังไม่ตั้งค่า Email"}
            </span>
          </span>
          <span className="flex min-w-0 items-center gap-2 text-[#655a70]">
            <KeyRound className="size-4 shrink-0 text-[#948b9b]" />
            <span className="truncate">
              {person.providerId || "ยังไม่เข้า ProviderID"}
            </span>
          </span>
        </div>
        <PersonActions
          person={person}
          canAssignSystemRole={canAssignSystemRole}
          currentProfileId={currentProfileId}
          onEdit={onEdit}
          onEditCid={onEditCid}
          onResetPassword={onResetPassword}
          compact
        />
      </CardContent>
    </Card>
  );
}

function PersonIdentity({
  person,
  compact,
}: {
  person: Person;
  compact: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar
        className={`${compact ? "size-11 rounded-2xl" : "size-10 rounded-xl"} shrink-0 ring-1 ring-[#ece6f0]`}
      >
        <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
        <AvatarFallback
          className={`${compact ? "rounded-2xl" : "rounded-xl"} bg-[#f2edf7] font-semibold text-[#694786]`}
        >
          {(person.fullName ?? person.name).trim().slice(0, 1) || "?"}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span
          className={`block truncate font-semibold text-[#40344a] ${compact ? "text-sm sm:text-base" : "max-w-52 text-sm"}`}
        >
          {person.fullName ?? person.name}
        </span>
        <span className="mt-1 block truncate text-xs text-[#8b8292]">
          {[person.position, person.positionLevel]
            .filter(Boolean)
            .join(" · ") || "ยังไม่ระบุตำแหน่ง"}
        </span>
        {compact && (
          <span className="mt-1 block truncate text-xs text-[#a097a7]">
            {person.workGroup || person.mission || "ยังไม่ระบุกลุ่มงาน"}
          </span>
        )}
      </span>
    </div>
  );
}

function PersonRoles({ person }: { person: Person }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {person.systemRole !== "USER" && (
        <Badge
          variant="outline"
          className="rounded-full border-[#e5d9ed] bg-[#f7f1fa] text-[#694786]"
        >
          {systemRoleNames[person.systemRole] ?? person.systemRole}
        </Badge>
      )}
      {person.capabilities.map((capability) => (
        <Badge
          key={capability}
          variant="outline"
          className="rounded-full border-[#e1e7da] bg-[#f3f7ee] text-[#5a7439]"
        >
          {capabilityNames[capability as keyof typeof capabilityNames] ??
            capability}
        </Badge>
      ))}
      {person.systemRole === "USER" && person.capabilities.length === 0 && (
        <Badge
          variant="outline"
          className="rounded-full border-[#f0d2cf] bg-[#fff5f3] text-[#994d45]"
        >
          ยังไม่กำหนดสิทธิ์
        </Badge>
      )}
    </div>
  );
}

function AccountState({ person }: { person: Person }) {
  const label =
    person.active === false
      ? "ปิดใช้งาน"
      : person.userId
        ? "เชื่อมแล้ว"
        : "รอเข้าใช้";
  const tone =
    person.active === false
      ? "border-[#f0d2cf] bg-[#fff3f1] text-[#a44e43]"
      : person.userId
        ? "border-[#dcebd1] bg-[#eff7e9] text-[#4e702f]"
        : "border-[#ede4d2] bg-[#fbf6ea] text-[#8e6b32]";
  return (
    <Badge variant="outline" className={`shrink-0 rounded-full ${tone}`}>
      {label}
    </Badge>
  );
}

function PersonActions({
  person,
  canAssignSystemRole,
  currentProfileId,
  onEdit,
  onEditCid,
  onResetPassword,
  compact,
}: {
  person: Person;
  canAssignSystemRole: boolean;
  currentProfileId: string;
  onEdit: () => void;
  onEditCid: () => void;
  onResetPassword: () => void;
  compact: boolean;
}) {
  const canManageTarget = canAssignSystemRole || person.systemRole === "USER";
  const canResetPassword =
    canManageTarget &&
    person.id !== currentProfileId &&
    Boolean(person.userId && person.email) &&
    person.active !== false;
  const resetHint =
    person.id === currentProfileId
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
  return (
    <div
      className={`mt-4 grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-3"}`}
    >
      <Button
        type="button"
        variant="outline"
        disabled={!canManageTarget}
        onClick={onEdit}
        title={
          !canManageTarget
            ? "เฉพาะ Superadmin จัดการบัญชี PM/Superadmin ได้"
            : undefined
        }
        className="h-10 min-w-0 rounded-xl border-[#e8e1ed] px-2.5 text-xs font-semibold text-[#5d4475] hover:bg-[#faf7fc] disabled:opacity-50 sm:text-sm"
      >
        <FilePenLine className="size-4 shrink-0" />
        แก้ไข
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={Boolean(person.userId) || !canManageTarget}
        onClick={onEditCid}
        title={
          person.userId
            ? "บัญชีเชื่อม ProviderID แล้ว ไม่สามารถเปลี่ยน CID ได้"
            : !canManageTarget
              ? "เฉพาะ Superadmin จัดการบัญชี PM/Superadmin ได้"
              : undefined
        }
        className="h-10 min-w-0 rounded-xl border-[#e8e1ed] px-2.5 text-xs font-semibold text-[#5d4475] hover:bg-[#faf7fc] disabled:opacity-50 sm:text-sm"
      >
        <IdCard className="size-4 shrink-0" />
        {person.cidRegistered ? "แก้ CID" : "เพิ่ม CID"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={!canResetPassword}
        onClick={onResetPassword}
        title={resetHint}
        className={`${compact ? "col-span-2" : "col-span-3 xl:col-span-1"} h-10 min-w-0 rounded-xl px-2.5 text-xs font-semibold text-[#684783] hover:bg-[#f7f3fa] disabled:opacity-45 sm:text-sm`}
      >
        <KeyRound className="size-4 shrink-0" />
        ออกรหัสผ่าน
      </Button>
    </div>
  );
}
