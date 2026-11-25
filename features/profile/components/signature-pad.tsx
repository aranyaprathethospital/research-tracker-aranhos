import { useRef, useState, type PointerEvent } from "react";
import { PenLine, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cropDrawnSignature } from "../profile-image";

export default function SignaturePad({ disabled, onSave }: {
  disabled: boolean;
  onSave: (file: File) => Promise<boolean>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function draw(event: PointerEvent<HTMLCanvasElement>, start: boolean) {
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    if (!context) return;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
    context.strokeStyle = "#302a38";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    if (start) {
      context.beginPath();
      context.moveTo(x, y);
    }
    context.lineTo(start ? x + 0.1 : x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
  }

  function clear() {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    setError("");
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk || saving || disabled || pointer.current !== null) return;
    setSaving(true);
    setError("");
    try {
      const file = await cropDrawnSignature(canvas);
      if (await onSave(file)) {
        clear();
        setOpen(false);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "บันทึกลายเซ็นไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <Button type="button" variant="outline" disabled={disabled} onClick={() => setOpen(true)}><PenLine /> วาดลายเซ็น</Button>;

  return (
    <div className="w-full min-w-0 space-y-3 rounded-xl border border-border bg-white p-3">
      <p className="text-sm text-muted-foreground">วาดด้วยเมาส์ นิ้ว หรือปากกาบนพื้นที่ด้านล่าง</p>
      <canvas
        ref={canvasRef}
        width={900}
        height={380}
        aria-label="พื้นที่วาดลายเซ็น"
        className="block h-auto w-full touch-none rounded-lg bg-[#faf8fc] ring-1 ring-border"
        onPointerDown={(event) => {
          if (disabled || saving || event.button !== 0 || pointer.current !== null) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointer.current = event.pointerId;
          draw(event, true);
          setHasInk(true);
        }}
        onPointerMove={(event) => {
          if (pointer.current === event.pointerId) draw(event, false);
        }}
        onLostPointerCapture={(event) => {
          if (pointer.current === event.pointerId) pointer.current = null;
        }}
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={disabled || saving || !hasInk} onClick={clear}><RotateCcw /> ล้าง</Button>
        <Button type="button" variant="ghost" disabled={disabled || saving} onClick={() => { clear(); setOpen(false); }}>ยกเลิก</Button>
        <Button type="button" disabled={disabled || saving || !hasInk} onClick={() => void save()}>{saving ? "กำลังบันทึก…" : "บันทึกลายเซ็น"}</Button>
      </div>
    </div>
  );
}
