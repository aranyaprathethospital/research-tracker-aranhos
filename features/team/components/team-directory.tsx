import { useMemo, useState } from "react";
import { getCoreRowModel, getPaginationRowModel, useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy";
import { Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
};

const columns: LegacyColumnDef<TeamMember>[] = [
  { accessorKey: "name", header: "สมาชิก" },
  { accessorKey: "workGroup", header: "กลุ่มงานและภารกิจ" },
  { accessorKey: "capabilities", header: "บทบาท" },
];

const capabilityNames = { ADVISEE: "advisee", ADVISOR: "advisor" } as const;
const roleFilters = [
  { value: "all", label: "ทั้งหมด" },
  { value: "ADVISEE", label: capabilityNames.ADVISEE },
  { value: "ADVISOR", label: capabilityNames.ADVISOR },
] as const;
type RoleFilter = (typeof roleFilters)[number]["value"];

export default function TeamDirectory({ people, loading = false }: { people: TeamMember[]; loading?: boolean }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const search = query.trim().toLocaleLowerCase();
  const filtered = useMemo(() => {
    if (!search && roleFilter === "all") return people;
    return people.filter((person) =>
      (roleFilter === "all" || person.capabilities.includes(roleFilter)) &&
      (!search || [person.name, person.position, person.positionLevel, positionTitle(person), person.mission, person.workGroup]
        .some((value) => value?.toLocaleLowerCase().includes(search))),
    );
  }, [people, roleFilter, search]);
  const table = useLegacyTable({
    data: filtered,
    columns,
    getRowId: (person) => person.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: TABLE_PAGE_SIZE } },
  });

  return (
    <Card>
      <section aria-labelledby="team-directory-title" aria-busy={loading}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#fffcf8] px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary"><Users aria-hidden className="size-5" /></span>
            <div>
              <h2 id="team-directory-title" className="text-2xl font-bold leading-tight">รายชื่อสมาชิก</h2>
              <p aria-live="polite" className="text-base text-muted-foreground">{loading ? "กำลังโหลดรายชื่อ" : `${filtered.length} คน`}</p>
            </div>
          </div>
          <div className="relative w-full sm:max-w-72">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={query} disabled={loading} onChange={(event) => {
              setQuery(event.target.value);
              table.setPageIndex(0);
            }} aria-label="ค้นหาสมาชิก" placeholder="ค้นหาชื่อ ตำแหน่ง หรือกลุ่มงาน" className="pl-10 text-base" />
          </div>
          <div role="group" aria-label="กรองตามบทบาท" className="flex w-full flex-wrap gap-1.5">
            {roleFilters.map(({ value, label }) => (
              <Button key={value} type="button" size="sm" variant={roleFilter === value ? "secondary" : "ghost"}
                aria-pressed={roleFilter === value} disabled={loading} onClick={() => {
                  setRoleFilter(value);
                  table.setPageIndex(0);
                }}>{label}</Button>
            ))}
          </div>
        </div>

        <Table aria-labelledby="team-directory-title" className="table-fixed md:table-auto">
          <TableHeader>
            <TableRow>
              {table.getHeaderGroups()[0]?.headers.map((header, index) => (
                <TableHead key={header.id} scope="col" className={index === 0 ? "md:w-[34%]" : "hidden md:table-cell"}>{String(header.column.columnDef.header)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? [0, 1, 2, 3].map((index) => (
              <TableRow key={index} aria-hidden>
                <TableCell colSpan={columns.length}>
                  <div className="flex items-center gap-3"><Skeleton className="size-10 shrink-0 rounded-full bg-secondary" /><Skeleton className="h-5 w-40 max-w-full bg-secondary" /></div>
                </TableCell>
              </TableRow>
            )) : table.getRowModel().rows.map(({ id, original: person }) => (
              <TableRow key={id}>
                <TableCell className="align-top">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar aria-hidden className="size-10 shrink-0 ring-1 ring-border">
                      <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback className="bg-secondary font-bold text-primary">{person.name.trim().slice(0, 1) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="wrap-break-word text-lg font-bold leading-tight">{person.name}</p>
                      <p className="mt-0.5 wrap-break-word text-muted-foreground">{positionTitle(person) || "ยังไม่ระบุตำแหน่ง"}</p>
                      <div className="mt-2 space-y-2 md:hidden">
                        <WorkDetails person={person} />
                        <TeamRoles person={person} />
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden align-top md:table-cell"><WorkDetails person={person} /></TableCell>
                <TableCell className="hidden align-top md:table-cell"><TeamRoles person={person} /></TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={columns.length} className="py-10 text-center text-base text-muted-foreground">{search || roleFilter !== "all" ? "ไม่พบสมาชิกที่ตรงกับตัวกรอง" : "ยังไม่มีสมาชิกในทีม"}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {!loading && filtered.length > 0 && (
          <TablePagination page={table.getState().pagination.pageIndex + 1} total={filtered.length} onPageChange={(page) => table.setPageIndex(page - 1)} />
        )}
      </section>
    </Card>
  );
}

function positionTitle({ position, positionLevel }: TeamMember) {
  return `${position?.trim() ?? ""}${positionLevel?.trim() ?? ""}`;
}

function WorkDetails({ person }: { person: TeamMember }) {
  return <div className="wrap-break-word">
    <p className="font-bold">{person.workGroup || "ยังไม่ระบุกลุ่มงาน"}</p>
    {person.mission && <p className="text-muted-foreground">{person.mission}</p>}
  </div>;
}

function TeamRoles({ person }: { person: TeamMember }) {
  return <div className="flex flex-wrap gap-1.5">
    {person.systemRole !== "USER" && <Badge variant="secondary">{person.systemRole}</Badge>}
    {person.capabilities.map((role) => <Badge key={role} variant="outline">{capabilityNames[role as keyof typeof capabilityNames] ?? role}</Badge>)}
    {person.systemRole === "USER" && !person.capabilities.length && <span className="text-muted-foreground">ยังไม่มีบทบาทงานวิจัย</span>}
  </div>;
}
