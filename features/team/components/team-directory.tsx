import { useState } from "react";
import Image from "next/image";
import { BriefcaseBusiness, Building2, ChevronDown, Search, ShieldCheck, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { TablePagination, TABLE_PAGE_SIZE } from "@/components/ui/table-pagination";

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
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const search = query.trim().toLocaleLowerCase();
  const filtered = search ? people.filter((person) => [person.name, person.position, person.positionLevel, person.mission, person.workGroup].some((value) => value?.toLocaleLowerCase().includes(search))) : people;
  const offset = (page - 1) * TABLE_PAGE_SIZE;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e7e0d9] bg-white p-4">
        <p aria-live="polite" className="flex items-center gap-2 text-lg font-bold"><Users aria-hidden className="size-5 text-primary" />{loading ? "กำลังโหลดรายชื่อ" : `${filtered.length} สมาชิก`}</p>
        <div className="relative w-full sm:max-w-72">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} disabled={loading} onChange={(event) => { setQuery(event.target.value); setPage(1); }} aria-label="ค้นหาสมาชิก" placeholder="ค้นหาชื่อ ตำแหน่ง หรือกลุ่มงาน" className="pl-10 text-base" />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => <Card key={item} className="rounded-xl border-[#e9e7ed] shadow-none"><CardContent className="flex items-center gap-4 p-5"><Skeleton className="size-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div></CardContent></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-xl border-dashed border-[#dcd8e2] bg-white shadow-none"><CardContent className="px-6 py-14 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#f2eef6] text-[#704b8d]"><Users className="size-5" /></span>
          <h2 className="mt-4 text-xl font-bold text-[#463a50]">{search ? "ไม่พบสมาชิกที่ตรงกับคำค้น" : "ยังไม่มีสมาชิกในทีม"}</h2>
        </CardContent></Card>
      ) : (
        <>
        <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.slice(offset, offset + TABLE_PAGE_SIZE).map((person) => (
            <Card className="border-t-2 border-t-[#d9c7df]" key={person.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-12 shrink-0 rounded-full ring-1 ring-[#e9e7ed]">
                    <AvatarImage src={person.avatarUrl ?? undefined} alt={`รูปโปรไฟล์ ${person.name}`} />
                    <AvatarFallback className="bg-[#f2edf7] text-base font-semibold text-[#694786]">{person.name.trim().slice(0, 1) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="wrap-break-word text-xl font-bold leading-tight text-[#3f3449]">{person.name}</h2>
                    <p className="mt-0.5 wrap-break-word text-base leading-tight text-muted-foreground">{person.position || "ยังไม่ระบุตำแหน่ง"}{person.positionLevel ? ` · ${person.positionLevel}` : ""}</p>
                  </div>
                </div>

                <div className="mt-4 flex min-h-7 flex-wrap gap-1.5">
                  {person.systemRole !== "USER" && <Badge variant="outline" className="rounded-full border-[#e5d9ed] bg-[#f7f1fa] text-[#694786]"><ShieldCheck className="mr-1 size-3.5" />{systemRoleNames[person.systemRole] ?? person.systemRole}</Badge>}
                  {person.capabilities.map((capability) => <Badge key={capability} variant="outline" className="rounded-full border-[#e1e7da] bg-[#f3f7ee] text-[#5a7439]">{capabilityNames[capability] ?? capability}</Badge>)}
                  {person.systemRole === "USER" && person.capabilities.length === 0 && <Badge variant="outline" className="rounded-full border-[#e8e4ec] text-[#817888]">ยังไม่มีบทบาทงานวิจัย</Badge>}
                </div>

                <div className="mt-4 grid gap-3 rounded-lg bg-[#f7f3ee] p-3.5">
                  <Detail icon={BriefcaseBusiness} label="ภารกิจ" value={person.mission || "ยังไม่ระบุ"} />
                  <Detail icon={Building2} label="กลุ่มงาน" value={person.workGroup || "ยังไม่ระบุ"} />
                </div>

                {person.signatureUrl && <details className="group mt-4 border-t border-[#ece6e1] pt-2">
                  <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 rounded text-base font-bold text-primary focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">ลายเซ็นในโปรไฟล์ <ChevronDown aria-hidden className="size-4 group-open:rotate-180" /></summary>
                  <Image src={person.signatureUrl} alt={`ลายเซ็น ${person.name}`} width={400} height={100} unoptimized loading="lazy" className="mt-2 h-14 w-full object-contain object-left" />
                </details>}
              </CardContent>
            </Card>
          ))}
        </div>
        <Card><TablePagination page={page} total={filtered.length} onPageChange={setPage} /></Card>
        </>
      )}
    </section>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof BriefcaseBusiness; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-[#8d8298]" />
      <div className="min-w-0"><div className="text-sm text-muted-foreground">{label}</div><div className="wrap-break-word text-base font-bold leading-tight">{value}</div></div>
    </div>
  );
}
