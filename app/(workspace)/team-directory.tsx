import Image from "next/image";
import { BriefcaseBusiness, Building2, ShieldCheck, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type TeamMember = {
  id: string;
  name: string;
  systemRole: string;
  capabilities: string[];
  position?: string;
  positionLevel?: string;
  mission?: string;
  workGroup?: string;
  avatarUrl?: string | null;
  signatureUrl?: string | null;
};

const capabilityNames: Record<string, string> = { ADVISEE: "Advisee · นักวิจัย", ADVISOR: "Advisor · ที่ปรึกษา" };
const systemRoleNames: Record<string, string> = { USER: "ผู้ใช้ทั่วไป", PM: "PM", SUPERADMIN: "Superadmin" };

export default function TeamDirectory({ people, loading = false }: { people: TeamMember[]; loading?: boolean }) {
  return <section className="space-y-5">
    <Card className="rounded-[1.75rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025]">
      <CardHeader className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div><span className="inline-flex items-center gap-2 rounded-full bg-[#f2edf7] px-3 py-1.5 text-sm font-semibold text-[#6d4a8b]"><Users className="size-4" /> RESEARCH TEAM</span><CardTitle className="mt-3 text-xl font-semibold text-[#382d43]">รายชื่อทีมวิจัย</CardTitle><p className="mt-1 text-base text-[#817888]">ดูผู้ประสานงาน ผู้วิจัย และที่ปรึกษาในระบบ</p></div>
        <Badge variant="outline" className="h-9 w-fit rounded-full border-[#e6e0ea] bg-white px-3 text-sm font-semibold text-[#655a70]">{loading ? "กำลังโหลด…" : `${people.length} คน`}</Badge>
      </CardHeader>
    </Card>
    {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <Card key={item} className="rounded-[1.5rem] border-[#e9e4ed]"><CardContent className="flex items-center gap-4 p-5"><Skeleton className="size-14 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div></CardContent></Card>)}</div> : people.length === 0 ? <Card className="rounded-[1.75rem] border-dashed border-[#dcd4e3] bg-white shadow-none"><CardContent className="px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f2edf7] text-[#704b8d]"><Users className="size-5" /></span><h2 className="mt-4 text-base font-semibold text-[#463a50]">ยังไม่มีสมาชิกในทีม</h2><p className="mt-1 text-sm text-[#817888]">รายชื่อจะแสดงเมื่อมีผู้ใช้ที่ได้รับสิทธิ์ในระบบ</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {people.map((person) => <Card className="overflow-hidden rounded-[1.5rem] border-[#e9e4ed] shadow-sm shadow-[#40304c]/[.025] transition hover:-translate-y-0.5 hover:shadow-md" key={person.id}>
        <div className="h-1 bg-gradient-to-r from-[#7750a4] via-[#9471b0] to-[#85aa56]" />
        <CardContent className="p-5">
          <div className="flex items-center gap-3"><Avatar className="size-14 rounded-2xl ring-1 ring-[#eeeaf2]"><AvatarImage src={person.avatarUrl ?? undefined} alt={`รูปโปรไฟล์ ${person.name}`} /><AvatarFallback className="rounded-2xl bg-[#f2edf7] text-lg font-semibold text-[#694786]">{person.name.trim().slice(0, 1) || "?"}</AvatarFallback></Avatar><div className="min-w-0"><h2 className="truncate text-base font-semibold text-[#3f3449]">{person.name}</h2><p className="mt-1 truncate text-sm text-[#817888]">{person.position || "ยังไม่ระบุตำแหน่ง"}{person.positionLevel ? ` · ${person.positionLevel}` : ""}</p></div></div>
          <div className="mt-4 flex flex-wrap gap-1.5">{person.systemRole !== "USER" && <Badge variant="outline" className="rounded-full border-[#e5d9ed] bg-[#f7f1fa] text-[#694786]"><ShieldCheck className="mr-1 size-3.5" />{systemRoleNames[person.systemRole] ?? person.systemRole}</Badge>}{person.capabilities.map((capability) => <Badge key={capability} variant="outline" className="rounded-full border-[#e1e7da] bg-[#f3f7ee] text-[#5a7439]">{capabilityNames[capability] ?? capability}</Badge>)}{person.systemRole === "USER" && person.capabilities.length === 0 && <Badge variant="outline" className="rounded-full border-[#e8e4ec] text-[#817888]">ยังไม่มีบทบาทงานวิจัย</Badge>}</div>
          <div className="mt-4 grid gap-3 rounded-2xl bg-[#faf9fb] p-4"><Detail icon={BriefcaseBusiness} label="ภารกิจ" value={person.mission || "ยังไม่ระบุ"} /><Detail icon={Building2} label="กลุ่มงาน" value={person.workGroup || "ยังไม่ระบุ"} /></div>
          <div className="mt-4 rounded-2xl border border-[#eeeaf2] bg-white p-3"><div className="text-sm font-semibold text-[#675b71]">ลายเซ็นในโปรไฟล์</div>{person.signatureUrl ? <Image src={person.signatureUrl} alt={`ลายเซ็น ${person.name}`} width={400} height={100} unoptimized className="mt-2 h-16 w-full object-contain" /> : <p className="mt-2 text-sm text-[#9a92a2]">ยังไม่มีลายเซ็น</p>}</div>
        </CardContent>
      </Card>)}
    </div>}
  </section>;
}

function Detail({ icon: Icon, label, value }: { icon: typeof BriefcaseBusiness; label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-[#8d8298]" /><div className="min-w-0"><div className="text-sm text-[#8a8292]">{label}</div><div className="mt-0.5 break-words text-sm font-medium leading-5 text-[#564b60]">{value}</div></div></div>;
}
