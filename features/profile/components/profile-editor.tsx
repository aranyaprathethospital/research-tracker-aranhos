"use client";

import ConnectionStatus from "@/components/status/connection-status";
import { workspaceFetch } from "@/lib/workspace-fetch";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Camera, KeyRound, Mail, Shuffle, Trash2, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PageHeading from "@/features/workspace/components/page-heading";
import WorkspaceShell from "@/features/workspace/components/workspace-shell";
import SignaturePad from "./signature-pad";
import { prepareAvatar } from "../profile-image";
import { ProfileFieldsLoading } from "@/features/workspace/components/workspace-page-skeletons";
import { LoadingShape } from "@/components/ui/page-loading";
import type { Role } from "@/lib/research-types";

type Profile = {
  fullName: string; email: string; systemRole: string; capabilities: string[];
  position: string; positionLevel: string; mission: string; workGroup: string;
  avatarUrl: string | null; signatureUrl: string | null; hasAvatar: boolean;
};

type ProfileEditorProps = {
  personName: string;
  role: Role;
  systemRole: string;
  availableRoles: Role[];
  projectCount: number;
};

const workFields = [
  { key: "position", label: "ตำแหน่ง" },
  { key: "positionLevel", label: "ระดับตำแหน่ง" },
  { key: "mission", label: "ภารกิจ" },
  { key: "workGroup", label: "กลุ่มงาน" },
] as const;
const avatarPresetCount = 9;

export default function ProfileEditor({ personName, role, systemRole, availableRoles, projectCount }: ProfileEditorProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<"profile" | "avatar" | "signature" | "avatar-delete" | null>(null);
  const [avatarDialog, setAvatarDialog] = useState<"random" | "delete" | null>(null);
  const [presetIndex, setPresetIndex] = useState<number | null>(null);
  const presetUrl = presetIndex === null ? null : `/images/profile-avatars/nurse-${presetIndex + 1}.webp`;
  const fetchProfile = useCallback(async () => {
    const response = await workspaceFetch("/api/profile", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "โหลดข้อมูลโปรไฟล์ไม่สำเร็จ");
    return result.profile as Profile;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchProfile().then((nextProfile) => { if (!cancelled) { setProfile(nextProfile); setName(nextProfile.fullName); } }).catch(() => { if (!cancelled) setLoadFailed(true); });
    return () => { cancelled = true; };
  }, [fetchProfile, loadAttempt]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const workDetails = Object.fromEntries(workFields.map(({ key }) => [key, String(form.get(key) ?? "").trim()]));
    const fullName = name.trim();
    setBusy("profile");
    try {
      const response = await workspaceFetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, ...workDetails }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "บันทึกโปรไฟล์ไม่สำเร็จ");
      setProfile((current) => current ? { ...current, ...workDetails, fullName } : current);
      setName(fullName);
      toast.success("บันทึกข้อมูลโปรไฟล์แล้ว");
    } catch (error) { toast.error(error instanceof Error ? error.message : "บันทึกโปรไฟล์ไม่สำเร็จ"); }
    finally { setBusy(null); }
  };

  const upload = async (kind: "avatar" | "signature", source?: File | string) => {
    if (!source || busy) return false;
    setBusy(kind);
    try {
      let file: File;
      if (typeof source === "string") {
        const preset = await fetch(source);
        if (!preset.ok) throw new Error("โหลดภาพการ์ตูนไม่สำเร็จ กรุณาลองอีกครั้ง");
        const blob = await preset.blob();
        file = new File([blob], "nurse-avatar.webp", { type: blob.type });
      } else {
        file = source;
      }
      const prepared = kind === "avatar" ? await prepareAvatar(file) : file;
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", prepared);
      const response = await workspaceFetch("/api/profile/media", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "อัปโหลดไฟล์ไม่สำเร็จ");
      const nextProfile = await fetchProfile();
      setProfile((current) => current && { ...current, avatarUrl: nextProfile.avatarUrl, signatureUrl: nextProfile.signatureUrl, hasAvatar: nextProfile.hasAvatar });
      toast.success(kind === "avatar" ? "เปลี่ยนรูปโปรไฟล์แล้ว" : "บันทึกลายเซ็นแล้ว");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "อัปโหลดไฟล์ไม่สำเร็จ");
      return false;
    }
    finally { setBusy(null); }
  };

  function randomizeAvatar() {
    const random = Math.random();
    setPresetIndex((previous) => previous === null
      ? Math.floor(random * avatarPresetCount)
      : (previous + 1 + Math.floor(random * (avatarPresetCount - 1))) % avatarPresetCount);
  }

  async function deleteAvatar() {
    if (busy) return;
    setBusy("avatar-delete");
    try {
      const response = await workspaceFetch("/api/profile/media", { method: "DELETE" });
      if (!response.ok) throw new Error("ลบรูปโปรไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง");
      setProfile((current) => current && { ...current, avatarUrl: null, hasAvatar: false });
      setAvatarDialog(null);
      toast.success("ลบรูปโปรไฟล์แล้ว");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ลบรูปโปรไฟล์ไม่สำเร็จ");
    } finally {
      setBusy(null);
    }
  }

  const roles = [...(profile?.systemRole === "USER" ? [] : profile ? [profile.systemRole] : []), ...(profile?.capabilities ?? [])];

  return <WorkspaceShell avatarUrl={profile?.avatarUrl ?? null} activeItem="โปรไฟล์" personName={profile?.fullName ?? personName} role={role} systemRole={systemRole} availableRoles={availableRoles} projectCount={projectCount}>
    <PageHeading eyebrow="บัญชีและการตั้งค่า" title="ข้อมูลส่วนตัว" description="ตรวจสอบข้อมูลที่ทีมเห็น และอัปเดตรูปโปรไฟล์หรือลายเซ็นของคุณ" />
    {loadFailed ? <ConnectionStatus retry={() => { setLoadFailed(false); setLoadAttempt((attempt) => attempt + 1); }} /> : !profile ? <LoadingShape label="กำลังโหลดข้อมูลโปรไฟล์"><ProfileFieldsLoading /></LoadingShape> : <>
    <section className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.45fr)]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <Card className="border-t-4 border-t-[#735388]">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <Avatar className="size-18 shrink-0 rounded-xl ring-1 ring-border"><AvatarImage src={profile.avatarUrl ?? undefined} alt={`รูปโปรไฟล์ ${profile.fullName}`} /><AvatarFallback className="rounded-xl bg-secondary text-3xl font-bold text-primary">{profile.fullName.slice(0, 1)}</AvatarFallback></Avatar>
              <div className="min-w-0">
                <h2 className="wrap-break-word text-2xl font-bold leading-tight">{profile.fullName}</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">{roles.map((value) => <Badge key={value} variant="outline" className="border-[#e5d9ed] bg-[#f7f1fa] text-primary">{roleName(value)}</Badge>)}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#eee8e2] pt-4">
              <FilePicker label="เปลี่ยนรูปโปรไฟล์" active={busy === "avatar"} disabled={busy !== null} onFile={(file) => void upload("avatar", file)} avatar />
              <Button type="button" variant="outline" disabled={busy !== null} onClick={() => { randomizeAvatar(); setAvatarDialog("random"); }}><Shuffle aria-hidden />สุ่มรูป</Button>
              {profile.hasAvatar && <Button type="button" variant="ghost" disabled={busy !== null} className="text-destructive" onClick={() => setAvatarDialog("delete")}><Trash2 aria-hidden />ลบรูปโปรไฟล์</Button>}
            </div>
          </CardContent>
        </Card>
        <Dialog open={avatarDialog !== null} onOpenChange={(open) => { if (!open && !busy) setAvatarDialog(null); }}>
          {avatarDialog && <DialogContent showCloseButton={!busy} className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{avatarDialog === "random" ? "สุ่มรูปโปรไฟล์" : "ลบรูปโปรไฟล์"}</DialogTitle>
              <DialogDescription>{avatarDialog === "random" ? "เลือกภาพการ์ตูนพยาบาลในชุดเครื่องแบบสีขาว" : "ระบบจะลบรูปปัจจุบันและแสดงอักษรย่อของคุณแทน"}</DialogDescription>
            </DialogHeader>
            {avatarDialog === "random" && presetUrl && <Image src={presetUrl} alt={`ตัวอย่างภาพการ์ตูนพยาบาลรูปที่ ${(presetIndex ?? 0) + 1}`} width={240} height={240} unoptimized className="mx-auto size-48 rounded-full border border-border object-cover sm:size-56" />}
            <DialogFooter className="flex-row flex-wrap justify-end">
              <Button type="button" variant="outline" disabled={busy !== null} onClick={() => setAvatarDialog(null)}>ยกเลิก</Button>
              {avatarDialog === "random" ? <>
                <Button type="button" variant="outline" disabled={busy !== null} onClick={randomizeAvatar}><Shuffle aria-hidden />สุ่มใหม่</Button>
                <Button type="button" disabled={busy !== null || !presetUrl} onClick={async () => {
                  if (presetUrl && await upload("avatar", presetUrl)) setAvatarDialog(null);
                }}>{busy === "avatar" ? "กำลังบันทึก…" : "ใช้รูปนี้"}</Button>
              </> : <Button type="button" variant="destructive" disabled={busy !== null} onClick={() => void deleteAvatar()}>{busy === "avatar-delete" ? "กำลังลบ…" : "ยืนยันลบรูป"}</Button>}
            </DialogFooter>
          </DialogContent>}
        </Dialog>
        <Card>
          <CardContent className="p-5 sm:p-6">
            <h2 className="text-xl font-bold">ลายเซ็น</h2>
            {profile.signatureUrl ? <Image src={profile.signatureUrl} alt="ลายเซ็นของฉัน" width={600} height={180} unoptimized className="mt-3 h-24 w-full rounded-lg border border-[#e7e0d9] bg-[#fbf8f5] object-contain p-2" /> : <p className="mt-3 grid min-h-20 place-items-center rounded-lg border border-dashed border-[#ded7d4] bg-[#fbf8f5] text-base text-muted-foreground">ยังไม่มีลายเซ็น</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <FilePicker label="อัปโหลดลายเซ็น" active={busy === "signature"} disabled={busy !== null} onFile={(file) => void upload("signature", file)} />
              <SignaturePad disabled={busy !== null} onSave={(file) => upload("signature", file)} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">ลายเซ็นนี้ใช้แสดงในโปรไฟล์</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-5 pb-4 pt-5 sm:px-7 sm:pt-7"><CardTitle className="text-2xl">ข้อมูลการทำงาน</CardTitle><p className="text-base text-muted-foreground">ข้อมูลส่วนนี้แสดงในรายชื่อทีมวิจัย</p></CardHeader>
        <CardContent className="space-y-5 px-5 pb-5 sm:px-7 sm:pb-7">
          <form onSubmit={saveProfile} className="space-y-4">
            <fieldset disabled={busy !== null} className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label htmlFor="profile-name" className="block space-y-2 text-sm font-semibold text-[#51465b] sm:col-span-2">
                ชื่อเต็ม
                <span className="relative block">
                  <UserRound aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#948b9b]" />
                  <Input id="profile-name" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className="h-12 rounded-xl pl-10 text-base" />
                </span>
              </label>
              {workFields.map(({ key, label }) => (
                <label key={key} className="block min-w-0 space-y-2 text-sm font-semibold text-[#51465b]">
                  <span>{label}</span>
                  <Input name={key} defaultValue={profile[key]} maxLength={160} className="h-12 rounded-xl text-base" />
                </label>
              ))}
            </fieldset>
            <div className="flex justify-end border-b border-[#eee8e2] pb-5"><Button type="submit" disabled={busy !== null}>{busy === "profile" ? "กำลังบันทึก…" : "บันทึกข้อมูลโปรไฟล์"}</Button></div>
          </form>
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnly icon={Mail} label="อีเมลสำหรับเข้าสู่ระบบ" value={profile.email || "ยังไม่ได้ตั้งค่า"} />
            <ReadOnly label="เลขประจำตัวประชาชน" value="ลงทะเบียนแล้ว" />
          </div>
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

function FilePicker({ label, active, disabled, onFile, avatar }: { label: string; active: boolean; disabled: boolean; onFile: (file?: File) => void; avatar?: boolean }) {
  const Icon = avatar ? Camera : Upload;
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#ded7d4] bg-white px-3 text-base font-bold text-[#564962] hover:bg-[#faf7fa] focus-within:outline-2 focus-within:outline-primary has-disabled:cursor-not-allowed has-disabled:opacity-60">
      <Icon aria-hidden className="size-4" />{active ? "กำลังอัปโหลด…" : label}
      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={disabled} onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        onFile(file);
      }} />
    </label>
  );
}

function roleName(role: string) {
  if (role === "SUPERADMIN") return "Superadmin";
  if (role === "PM") return "PM · ผู้จัดการ";
  if (role === "ADVISOR") return "Advisor · ที่ปรึกษา";
  if (role === "ADVISEE") return "Advisee · นักวิจัย";
  return role;
}
