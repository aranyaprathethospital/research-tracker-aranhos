"use client";

import { useState } from "react";
import {
  BadgeCheck,
  KeyRound,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PageHeading from "@/features/workspace/components/page-heading";
import WorkspaceShell from "@/features/workspace/components/workspace-shell";
import UserDirectory from "@/features/users/components/user-directory";
import type { UserDirectoryPerson } from "@/features/users/types";
import type { Role } from "@/lib/research-types";

type UserManagementPageProps = {
  initialPeople: UserDirectoryPerson[];
  personName: string;
  avatarUrl: string | null;
  currentProfileId: string;
  systemRole: string;
  role: Role;
  availableRoles: Role[];
  projectCount: number;
  commentCount: number;
};

export default function UserManagementPage({
  initialPeople,
  personName,
  avatarUrl,
  currentProfileId,
  systemRole,
  role,
  availableRoles,
  projectCount,
  commentCount,
}: UserManagementPageProps) {
  const [people, setPeople] = useState(initialPeople);

  const activeAccounts = people.filter((person) => person.active !== false).length;
  const linkedAccounts = people.filter((person) => Boolean(person.userId)).length;
  const pendingAccounts = people.length - linkedAccounts;
  const canAssignSystemRole = systemRole === "SUPERADMIN";

  return (
    <WorkspaceShell
      activeItem="จัดการผู้ใช้"
      personName={personName}
      avatarUrl={avatarUrl}
      role={role}
      systemRole={systemRole}
      availableRoles={availableRoles}
      projectCount={projectCount}
      commentCount={commentCount}
    >
      <PageHeading
        eyebrow={<span className="inline-flex items-center gap-2"><ShieldCheck className="size-4" />ศูนย์จัดการระบบ</span>}
        title="จัดการผู้ใช้และสิทธิ์"
        description={canAssignSystemRole
          ? "จัดการบัญชีผู้ใช้ มอบหมาย PM และควบคุมสิทธิ์ระบบในที่เดียว"
          : "ลงทะเบียนผู้ใช้และจัดการสิทธิ์ Advisor/Advisee สำหรับทีมวิจัย"}
      />

      <section aria-label="สรุปบัญชีผู้ใช้" className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <SummaryCard icon={UsersRound} label="ผู้ใช้ทั้งหมด" value={people.length} detail="รายการในระบบ" tone="violet" />
        <SummaryCard icon={UserCheck} label="เปิดใช้งาน" value={activeAccounts} detail="เข้าสู่ระบบได้" tone="green" />
        <SummaryCard icon={BadgeCheck} label="เชื่อม ProviderID" value={linkedAccounts} detail="เคยเข้าสู่ระบบแล้ว" tone="blue" />
        <SummaryCard icon={KeyRound} label="รอเชื่อมบัญชี" value={pendingAccounts} detail="ยังไม่เข้า ProviderID" tone="amber" />
      </section>

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#e9e7ed] bg-white px-4 py-3.5 text-sm leading-6 text-[#6f6878]">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#f2eef6] text-[#704b8d]"><ShieldCheck className="size-4" /></span>
        <p>
          {canAssignSystemRole
            ? "Superadmin สามารถกำหนดบทบาทระบบ PM/Superadmin ได้ ส่วน PM จัดการบัญชีผู้ใช้ทั่วไปและความสามารถ Advisor/Advisee"
            : "PM จัดการบัญชีผู้ใช้ทั่วไปและความสามารถ Advisor/Advisee ได้ การกำหนดบทบาท PM หรือ Superadmin ทำโดย Superadmin"}
        </p>
      </div>

      <UserDirectory people={people} onChange={setPeople} canAssignSystemRole={canAssignSystemRole} currentProfileId={currentProfileId} />
      <footer className="mt-7 hidden items-center justify-between border-t border-[#e8e6ec] pt-5 text-sm text-[#8a8292] sm:flex">
        <span>Research Tracker · จัดการบัญชีผู้ใช้</span>
        <span>ตรวจสิทธิ์จากบัญชี {systemRole === "SUPERADMIN" ? "Superadmin" : "PM"}</span>
      </footer>
    </WorkspaceShell>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
  detail: string;
  tone: "violet" | "green" | "blue" | "amber";
}) {
  const tones = {
    violet: "bg-[#f2edf7] text-[#704b8d]",
    green: "bg-[#eef5e7] text-[#66813f]",
    blue: "bg-[#edf3fb] text-[#5473a1]",
    amber: "bg-[#faf2e4] text-[#9a7138]",
  };

  return (
    <Card className="rounded-2xl border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025] transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#40304c]/[.06] motion-reduce:transition-none">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-[18px]" /></span>
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-[#362a40] sm:text-3xl">{String(value).padStart(2, "0")}</span>
        </div>
        <p className="mt-3 text-sm font-semibold text-[#51465c]">{label}</p>
        <p className="mt-1 text-xs text-[#8b8292]">{detail}</p>
      </CardContent>
    </Card>
  );
}
