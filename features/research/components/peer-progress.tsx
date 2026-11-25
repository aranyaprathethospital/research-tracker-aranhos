import { useMemo, useState } from "react";
import { Layers3, TrendingUp, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TABLE_PAGE_SIZE, TablePagination } from "@/components/ui/table-pagination";
import { stages } from "@/lib/research-types";
import { Progress, StageBadge } from "./project-display";
import { StageSelect } from "./project-select";

export type PeerProject = {
  id: string;
  title: string;
  researcher: string;
  stage: number;
  progress: number;
};

export default function PeerProgress({ projects }: { projects: PeerProject[] }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("th");
    return projects.filter((project) =>
      (stage === "ทั้งหมด" || project.stage === Number(stage)) &&
      `${project.title} ${project.researcher}`.toLocaleLowerCase("th").includes(text),
    );
  }, [projects, query, stage]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE)));
  const visible = filtered.slice((currentPage - 1) * TABLE_PAGE_SIZE, currentPage * TABLE_PAGE_SIZE);
  const metrics = [
    { label: "โครงการของเพื่อนร่วมทีม", value: projects.length, icon: UsersRound },
    { label: "กำลังดำเนินการ", value: projects.filter((project) => project.stage > 0 && project.stage < stages.length - 1).length, icon: Layers3 },
    { label: "ถึงขั้นนำเสนอ", value: projects.filter((project) => project.stage === stages.length - 1).length, icon: TrendingUp },
  ];

  return (
    <section aria-labelledby="peer-progress-heading" className="mb-6 overflow-hidden rounded-xl border border-[#e7e0d9] bg-white">
      <div className="border-b border-[#e7e0d9] bg-[#fffcf8] p-5 sm:p-7">
        <h2 id="peer-progress-heading" className="text-3xl font-bold leading-tight">ความคืบหน้าทีมวิจัย</h2>
        <p className="mt-1 text-base leading-snug text-muted-foreground">ดูชื่อเรื่อง ผู้วิจัย และขั้นตอนของโครงการอื่นในทีม</p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
              <Icon aria-hidden className="size-5 shrink-0 text-primary" />
              <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 text-xl font-semibold tabular-nums">{value}</dd></div>
            </div>
          ))}
        </dl>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] sm:p-5">
        <label className="block min-w-0 space-y-1.5 text-base font-bold">
          <span>ค้นหาชื่อเรื่องหรือผู้วิจัย</span>
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        </label>
        <div className="min-w-0 space-y-1.5 text-base font-bold">
          <p>ขั้นตอน</p>
          <StageSelect value={stage} filter onChange={(value) => { setStage(value); setPage(1); }} />
        </div>
      </div>
      {visible.length ? (
        <ul className="grid gap-3 px-4 pb-5 sm:px-5 lg:grid-cols-2">
          {visible.map((project) => (
            <li key={project.id} className="min-w-0 space-y-3 rounded-xl border border-border bg-[#faf8fc] p-4">
              <div>
                <h3 className="wrap-break-word font-semibold text-foreground">{project.title}</h3>
                <p className="mt-1 wrap-break-word text-sm text-muted-foreground">{project.researcher}</p>
              </div>
              <StageBadge stage={project.stage} />
              <Progress value={project.progress} />
            </li>
          ))}
        </ul>
      ) : <p role="status" className="px-4 pb-7 pt-2 text-center text-sm text-muted-foreground">{projects.length ? "ไม่พบโครงการที่ตรงกับตัวกรอง" : "ยังไม่มีโครงการของผู้วิจัยคนอื่น"}</p>}
      {filtered.length > 0 && <TablePagination page={currentPage} total={filtered.length} onPageChange={setPage} />}
    </section>
  );
}
