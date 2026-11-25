"use client";

import { useState } from "react";
import {
  BadgeCheck,
  KeyRound,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
    >
      <PageHeading
        eyebrow={<span className="inline-flex items-center gap-2"><ShieldCheck className="size-4" />ศูนย์จัดการระบบ</span>}
        title="จัดการผู้ใช้และสิทธิ์"
        description={canAssignSystemRole
          ? "จัดการบัญชีผู้ใช้ มอบหมาย PM และควบคุมสิทธิ์ระบบในที่เดียว"
          : "ลงทะเบียนผู้ใช้และจัดการสิทธิ์ Advisor/Advisee สำหรับทีมวิจัย"}
      />

      <Card role="region" aria-label="สรุปบัญชีผู้ใช้" className="mb-5 grid grid-cols-2 divide-[#e7e0d9] bg-[#fffcf8] xl:grid-cols-4 xl:divide-x">
        <SummaryCard icon={UsersRound} label="ผู้ใช้ทั้งหมด" value={people.length} detail="รายการในระบบ" tone="violet" />
        <SummaryCard icon={UserCheck} label="เปิดใช้งาน" value={activeAccounts} detail="เข้าสู่ระบบได้" tone="green" />
        <SummaryCard icon={BadgeCheck} label="เชื่อม ProviderID" value={linkedAccounts} detail="เคยเข้าสู่ระบบแล้ว" tone="blue" />
        <SummaryCard icon={KeyRound} label="รอเชื่อมบัญชี" value={pendingAccounts} detail="ยังไม่เข้า ProviderID" tone="amber" />
      </Card>

      <UserDirectory people={people} onChange={setPeople} canAssignSystemRole={canAssignSystemRole} currentProfileId={currentProfileId} />
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
    <div className="border-[#e7e0d9] p-4 first:border-r second:border-b nth-3:border-r nth-3:border-t sm:p-5 xl:border-0">
        <div className="flex items-start justify-between gap-2">
          <span aria-hidden className={`grid size-9 place-items-center rounded-lg ${tones[tone]}`}><Icon className="size-[18px]" /></span>
          <span className="text-4xl font-bold leading-none tabular-nums text-[#362a40]">{value}</span>
        </div>
        <p className="mt-3 text-lg font-bold leading-tight text-[#51465c]">{label}</p>
        <p className="text-base text-muted-foreground">{detail}</p>
    </div>
  );
}
