"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Camera, KeyRound, Mail, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageHeading from "@/features/workspace/components/page-heading";
import WorkspaceShell from "@/features/workspace/components/workspace-shell";
import { ProfileFieldsLoading } from "@/features/workspace/components/workspace-page-skeletons";
import { LoadingShape } from "@/components/ui/page-loading";
import type { Role } from "@/lib/research-types";

type Profile = {
  fullName: string; email: string; systemRole: string; capabilities: string[];
  position: string; positionLevel: string; mission: string; workGroup: string;
  avatarUrl: string | null; signatureUrl: string | null;
};

type ProfileEditorProps = {
  personName: string;
  role: Role;
  systemRole: string;
  availableRoles: Role[];
  projectCount: number;
};

export default function ProfileEditor({ personName, role, systemRole, availableRoles, projectCount }: ProfileEditorProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const fetchProfile = useCallback(async () => {
    const response = await fetch("/api/profile", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "โหลดข้อมูลโปรไฟล์ไม่สำเร็จ");
    return result.profile as Profile;
  }, []);
  const load = useCallback(async () => {
    const nextProfile = await fetchProfile();
    setProfile(nextProfile);
    setName(nextProfile.fullName);
  }, [fetchProfile]);

  useEffect(() => {
    let cancelled = false;
    void fetchProfile().then((nextProfile) => { if (!cancelled) { setProfile(nextProfile); setName(nextProfile.fullName); } }).catch((error) => { if (!cancelled) toast.error(error instanceof Error ? error.message : "โหลดข้อมูลโปรไฟล์ไม่สำเร็จ"); });
    return () => { cancelled = true; };
  }, [fetchProfile]);

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: name }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "บันทึกโปรไฟล์ไม่สำเร็จ");
      await load();
      toast.success("บันทึกชื่อแล้ว");
    } catch (error) { toast.error(error instanceof Error ? error.message : "บันทึกโปรไฟล์ไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  const upload = async (kind: "avatar" | "signature", file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData(); form.set("kind", kind); form.set("file", file);
      const response = await fetch("/api/profile/media", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "อัปโหลดไฟล์ไม่สำเร็จ");
      await load();
      toast.success(kind === "avatar" ? "เปลี่ยนรูปโปรไฟล์แล้ว" : "บันทึกลายเซ็นแล้ว");
    } catch (error) { toast.error(error instanceof Error ? error.message : "อัปโหลดไฟล์ไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  const roles = [...(profile?.systemRole === "USER" ? [] : profile ? [profile.systemRole] : []), ...(profile?.capabilities ?? [])];

  return <WorkspaceShell activeItem="โปรไฟล์" personName={profile?.fullName ?? personName} role={role} systemRole={systemRole} availableRoles={availableRoles} projectCount={projectCount} commentCount={0}>
    <PageHeading eyebrow="บัญชีและการตั้งค่า" title="ข้อมูลส่วนตัว" description="ตรวจสอบข้อมูลที่ทีมเห็น และอัปเดตรูปโปรไฟล์หรือลายเซ็นของคุณ" />
    {!profile ? <LoadingShape label="กำลังโหลดข้อมูลโปรไฟล์"><ProfileFieldsLoading /></LoadingShape> : <>
    <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.5fr)]">
      <Card className="overflow-hidden rounded-2xl border-[#e9e7ed] shadow-none">
        <div className="h-20 bg-[#f2eef6] sm:h-24" />
        <CardContent className="relative px-5 pb-5 sm:px-6 sm:pb-6">
          <Avatar className="-mt-11 size-22 rounded-2xl border-4 border-white sm:-mt-12 sm:size-24"><AvatarImage src={profile.avatarUrl ?? undefined} alt={`รูปโปรไฟล์ ${profile.fullName}`} /><AvatarFallback className="rounded-xl bg-[#f2edf7] text-3xl font-semibold text-[#694786]">{profile.fullName.slice(0, 1)}</AvatarFallback></Avatar>
          <div className="mt-3"><h2 className="truncate text-xl font-semibold tracking-tight text-[#342740]">{profile.fullName}</h2><p className="mt-1 break-all text-sm text-[#817888]">{profile.email || "ยังไม่ได้ตั้งค่า Email"}</p><p className="mt-2 text-sm leading-6 text-[#817888]">ข้อมูลนี้แสดงต่อสมาชิกในทีมที่ลงชื่อเข้าใช้</p></div>
          <div className="mt-4 flex flex-wrap gap-2">{roles.length ? roles.map((value) => <Badge key={value} variant="outline" className="rounded-full border-[#e5d9ed] bg-[#f7f1fa] text-[#694786]">{roleName(value)}</Badge>) : <Badge variant="outline" className="rounded-full text-[#817888]">ยังไม่มีบทบาท</Badge>}</div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-2xl border border-[#eeeaf2] bg-[#fcfbfd] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#50445b]"><Camera className="size-4 text-[#765196]" />รูปโปรไฟล์</div><div className="mt-3 flex items-center gap-3"><Avatar className="size-14 rounded-xl"><AvatarImage src={profile.avatarUrl ?? undefined} alt="" /><AvatarFallback className="rounded-xl bg-[#f2edf7] text-lg text-[#694786]">{profile.fullName.slice(0, 1)}</AvatarFallback></Avatar><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#e6e0ea] bg-white px-3 text-sm font-semibold text-[#564962] transition hover:bg-[#f7f4f9]"><Upload className="size-4" />เลือกรูป<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(event) => void upload("avatar", event.target.files?.[0])} /></label></div></section>
            <section className="rounded-2xl border border-[#eeeaf2] bg-[#fcfbfd] p-4"><div className="text-sm font-semibold text-[#50445b]">ลายเซ็น</div>{profile.signatureUrl ? <Image src={profile.signatureUrl} alt="ลายเซ็นของฉัน" width={600} height={180} unoptimized className="mt-3 h-24 w-full rounded-xl border border-[#eeeaf2] bg-white object-contain p-2" /> : <div className="mt-3 grid h-24 place-items-center rounded-xl border border-dashed border-[#ddd5e4] bg-white text-sm text-[#958c9c]">ยังไม่มีลายเซ็น</div>}<label className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#e6e0ea] bg-white px-3 text-sm font-semibold text-[#564962] transition hover:bg-[#f7f4f9]"><Upload className="size-4" />เลือกรูปลายเซ็น<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(event) => void upload("signature", event.target.files?.[0])} /></label><p className="mt-2 text-sm leading-5 text-[#8b8292]">จัดเก็บไว้ในโปรไฟล์ ยังไม่ใช้ลงนามอนุมัติเอกสาร</p></section>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-[#e9e7ed] shadow-none">
        <CardHeader className="px-5 pb-4 pt-5 sm:px-7 sm:pt-7"><CardTitle className="text-lg font-semibold text-[#382d43] sm:text-xl">รายละเอียดบัญชี</CardTitle><p className="text-base leading-6 text-[#817888]">ชื่อที่แสดงและข้อมูลการทำงานในระบบ</p></CardHeader>
        <CardContent className="space-y-5 px-5 pb-5 sm:px-7 sm:pb-7">
          <form onSubmit={saveName} className="space-y-3"><label htmlFor="profile-name" className="block space-y-2 text-sm font-semibold text-[#51465b]">ชื่อเต็ม<span className="relative block"><UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#948b9b]" /><Input id="profile-name" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className="h-12 rounded-xl border-[#e7e1eb] pl-10 text-base" /></span></label><Button type="submit" disabled={busy} className="h-11 rounded-xl px-4">บันทึกชื่อ</Button></form>
          <div className="grid gap-3 sm:grid-cols-2"><ReadOnly icon={Mail} label="Email สำหรับเข้าสู่ระบบ" value={profile.email || "ยังไม่ได้ตั้งค่า"} /><ReadOnly label="เลขประจำตัวประชาชน" value="ลงทะเบียนแล้ว · ซ่อนไว้เพื่อความปลอดภัย" /><ReadOnly label="ตำแหน่ง" value={profile.position || "ยังไม่ระบุ"} /><ReadOnly label="ระดับตำแหน่ง" value={profile.positionLevel || "ยังไม่ระบุ"} /><ReadOnly label="ภารกิจ" value={profile.mission || "ยังไม่ระบุ"} /><ReadOnly label="กลุ่มงาน" value={profile.workGroup || "ยังไม่ระบุ"} /></div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[#eeeaf2] bg-[#fcfbfd] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold text-[#51465b]">รหัสผ่านสำรอง</div><p className="mt-1 text-sm leading-5 text-[#817888]">เปลี่ยนรหัสผ่านที่ใช้เข้าสู่ระบบด้วย Email</p></div><Link href="/account/password" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e4dee9] bg-white px-4 text-sm font-semibold text-[#4e425b] transition hover:bg-[#f8f5fa]"><KeyRound className="size-4" />เปลี่ยนรหัสผ่าน</Link></div>
        </CardContent>
      </Card>
    </section>
    </>}
  </WorkspaceShell>;
}

function ReadOnly({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Mail }) {
  return <div className="min-w-0 rounded-xl border border-[#eeeaf2] bg-[#fcfbfd] p-3.5"><span className="flex items-center gap-1.5 text-sm text-[#8b8292]">{Icon && <Icon className="size-3.5" />}{label}</span><span className="mt-1.5 block break-words text-sm font-semibold leading-5 text-[#50455a]">{value}</span></div>;
}

function roleName(role: string) {
  if (role === "SUPERADMIN") return "Superadmin";
  if (role === "PM") return "PM · ผู้จัดการ";
  if (role === "ADVISOR") return "Advisor · ที่ปรึกษา";
  if (role === "ADVISEE") return "Advisee · นักวิจัย";
  return role;
}
