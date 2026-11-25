import { workspaceFetch } from "@/lib/workspace-fetch";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { titleRoundLabel, type Research } from "@/lib/research-types";

const dateFormat = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

export default function ProjectTitleHistory({ item, canEdit, onUpdate }: {
  item: Research;
  canEdit: boolean;
  onUpdate: (project: Research) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [editing, setEditing] = useState<"edit" | "advance" | null>(null);
  const [confirmFinal, setConfirmFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState<Research | null>(null);
  const nextLabel = `บันทึกชื่อ${titleRoundLabel(item.titleVersion + 1)}`;
  const editLabel = item.titleVersion >= 3 ? "แก้ชื่อ Final" : "แก้ชื่อรอบปัจจุบัน";
  const unchanged = editing === "edit" && title.trim() === item.title;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || busy || latest || !title.trim() || unchanged) return;
    if (editing === "advance" && item.titleVersion === 2 && !confirmFinal) {
      setConfirmFinal(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await workspaceFetch("/api/projects/title", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, expectedVersion: item.titleVersion, expectedTitle: item.title, title, action: editing }),
      });
      const result = await response.json();
      if (response.status === 409 && result.project) setLatest(result.project);
      if (!response.ok) throw new Error(result.error ?? "บันทึกชื่อเรื่องไม่สำเร็จ");
      onUpdate(result.project);
      setEditing(null);
      toast.success("บันทึกชื่อเรื่องแล้ว");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "บันทึกชื่อเรื่องไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-5 space-y-4 rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">ประวัติชื่อเรื่อง</h3>
        {canEdit && !editing && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing("edit")}>{editLabel}</Button>
            {item.titleVersion < 3 && <Button type="button" variant="outline" onClick={() => setEditing("advance")}>{nextLabel}</Button>}
          </div>
        )}
      </div>
      {canEdit && editing && (
        <form onSubmit={submit} className="space-y-3 rounded-xl bg-secondary/50 p-3 sm:p-4">
          <label className="block space-y-2 text-sm font-semibold">
            <span>{editing === "edit" ? `ชื่อเรื่องงานวิจัย · ${titleRoundLabel(item.titleVersion)}` : "ชื่อเรื่องงานวิจัย"}</span>
            <Input required value={title} disabled={busy || Boolean(latest)} onChange={(event) => {
              setTitle(event.target.value);
              setConfirmFinal(false);
            }} />
          </label>
          {confirmFinal && <p role="status" className="text-sm text-foreground">ยืนยันใช้ชื่อนี้เป็น Final หลังจากนี้เฉพาะ PM ที่แก้ไขชื่อได้</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" disabled={busy || Boolean(latest)} onClick={() => {
              setTitle(item.title);
              setEditing(null);
              setConfirmFinal(false);
              setError("");
            }}>ยกเลิก</Button>
            {latest ? <Button type="button" onClick={() => onUpdate(latest)}>โหลดชื่อเรื่องล่าสุด</Button> :
              <Button type="submit" disabled={busy || !title.trim() || unchanged}>{busy ? "กำลังบันทึก…" : confirmFinal ? "ยืนยันชื่อ Final" : editing === "edit" ? "บันทึกการแก้ไขชื่อ" : nextLabel}</Button>}
          </div>
        </form>
      )}
      <ol className="divide-y divide-border">
        {item.titleHistory.map((entry) => (
          <li key={entry.version} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <Badge variant={entry.version === item.titleVersion ? "secondary" : "outline"}>{titleRoundLabel(entry.version)}</Badge>
            <div className="min-w-0">
              <p className="wrap-break-word text-sm font-medium">{entry.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{entry.createdAt && entry.author ? `${entry.author} · ${dateFormat.format(new Date(entry.createdAt))}` : "ข้อมูลเดิม · ไม่ทราบผู้บันทึกหรือเวลา"}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
