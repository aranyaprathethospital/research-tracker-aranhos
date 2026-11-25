import { useId } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type AdvisorOption = { id: string; name: string };

export default function SecondaryAdvisorPicker({ options, selectedIds, onChange, disabled = false }: {
  options: AdvisorOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const selected = options.filter((option) => selectedIds.includes(option.id));

  return (
    <div className="min-w-0 space-y-2 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-foreground">อาจารย์ที่ปรึกษารอง <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span></label>
        <span aria-live="polite" className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium tabular-nums text-primary">เลือกแล้ว {selected.length} คน</span>
      </div>
      <Combobox.Root multiple items={options} value={selected} onValueChange={(next) => onChange(next.map((option) => option.id))}
        itemToStringLabel={(option) => option.name} itemToStringValue={(option) => option.id}
        isItemEqualToValue={(option, current) => option.id === current.id} disabled={disabled || !options.length} autoHighlight>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Combobox.Input id={id} aria-describedby={`${id}-hint`} render={<Input className="h-11 rounded-xl pl-9 pr-11 text-base" />} />
          <Combobox.Trigger type="button" aria-label="เปิดรายชื่อที่ปรึกษารอง" className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
            <ChevronDown aria-hidden className="size-4" />
          </Combobox.Trigger>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner align="start" sideOffset={6} className="z-[60]">
            <Combobox.Popup className="w-(--anchor-width) max-w-(--available-width) rounded-xl border border-border bg-white p-1.5 shadow-xl">
              <Combobox.Empty className="empty:hidden px-3 py-2 text-sm text-muted-foreground">ไม่พบชื่อที่ค้นหา</Combobox.Empty>
              <Combobox.List className="max-h-[min(13.75rem,calc(var(--available-height)-1rem))] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
                {(option: AdvisorOption) => (
                  <Combobox.Item key={option.id} value={option} className="flex h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 text-sm outline-none data-highlighted:bg-secondary data-selected:font-semibold data-selected:text-primary">
                    <span className="min-w-0 truncate" title={option.name}>{option.name}</span>
                    <Combobox.ItemIndicator><Check aria-hidden className="size-4 shrink-0" /></Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">{options.length ? "พิมพ์ค้นหาชื่อและเลือกได้หลายคน" : "ไม่มีรายชื่อที่ปรึกษารองให้เลือก"}</p>
      {selected.length > 0 && (
        <ul aria-label="ที่ปรึกษารองที่เลือก" className="flex max-h-28 flex-wrap content-start gap-2 overflow-y-auto overscroll-contain py-1">
          {selected.map((option) => (
            <li key={option.id} className="flex max-w-full items-center gap-1 rounded-lg bg-secondary pl-2.5 text-sm text-primary">
              <span className="min-w-0 wrap-break-word">{option.name}</span>
              <button type="button" disabled={disabled} aria-label={`เอา ${option.name} ออกจากที่ปรึกษารอง`}
                onClick={() => onChange(selectedIds.filter((id) => id !== option.id))}
                className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
