import { useId } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { stages } from "@/lib/research-types";

const stageOptions = stages.map((label, index) => ({ label, value: String(index) }));
const stageFilterOptions = [{ label: "ทุกขั้นตอน", value: "ทั้งหมด" }, ...stageOptions];

export function StageSelect({ value, onChange, filter = false, disabled = false }: { value: string; onChange: (value: string) => void; filter?: boolean; disabled?: boolean }) {
  return <SelectField label={filter ? "กรองตามขั้นตอน" : "ขั้นตอนปัจจุบัน"} options={filter ? stageFilterOptions : stageOptions} value={value} disabled={disabled} onChange={onChange} />;
}
export function ProjectPersonSelect({ label, options, value, onChange, disabled }: {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block text-base font-bold text-[#51465b]">{label}</label>
      <Combobox.Root items={options} value={options.find((option) => option.id === value) ?? null}
        onValueChange={(next) => onChange(next?.id ?? "")}
        itemToStringLabel={(item) => item.name} itemToStringValue={(item) => item.id}
        isItemEqualToValue={(item, selected) => item.id === selected.id}
        disabled={disabled || options.length === 0} autoHighlight>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Combobox.Input id={id} render={<Input className="h-11 border-[#e4dcd7] pr-11 pl-9 text-base" />} />
          <Combobox.Trigger type="button" aria-label={`เปิดรายชื่อ${label}`} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
            <ChevronDown aria-hidden className="size-4" />
          </Combobox.Trigger>
        </div>
        {!options.length && <p className="text-sm text-muted-foreground">ไม่มีรายชื่อให้เลือก</p>}
        <Combobox.Portal>
          <Combobox.Positioner align="start" sideOffset={6} className="z-[60]">
            <Combobox.Popup className="w-(--anchor-width) max-w-(--available-width) rounded-lg border border-[#e7e0d9] bg-white p-1.5 shadow-lg">
              <Combobox.Empty className="empty:hidden px-3 py-2 text-base text-muted-foreground">ไม่พบชื่อที่ค้นหา</Combobox.Empty>
              <Combobox.List className="max-h-[min(13.75rem,calc(var(--available-height)-1rem))] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
                {(option: (typeof options)[number]) => (
                  <Combobox.Item key={option.id} value={option} className="flex h-11 cursor-pointer items-center justify-between gap-2 rounded-md px-3 text-base outline-none data-highlighted:bg-secondary data-selected:font-bold data-selected:text-primary">
                    <span className="min-w-0 truncate" title={option.name}>{option.name}</span>
                    <Combobox.ItemIndicator><Check aria-hidden className="size-4 shrink-0" /></Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}
