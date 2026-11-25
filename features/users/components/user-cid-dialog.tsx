import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { UserDirectoryPerson as Person } from "@/features/users/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, IdCard, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { inputClass, FormField } from "./user-directory-fields";
import { cidFormSchema, type CidFormValues } from "./user-form-schema";

export function CidEditorDialog({
  person,
  onOpenChange,
  onSave,
}: {
  person: Person;
  onOpenChange: (open: boolean) => void;
  onSave: (person: Person, cid: string) => Promise<void>;
}) {
  const [saveError, setSaveError] = useState("");
  const form = useForm<CidFormValues>({
    resolver: zodResolver(cidFormSchema),
    defaultValues: { cid: "" },
  });
  const submit = form.handleSubmit(async ({ cid }) => {
    setSaveError("");
    try {
      await onSave(person, cid);
      onOpenChange(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "บันทึก CID ไม่สำเร็จ",
      );
    }
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-1rem)] max-w-lg rounded-[1.75rem] border border-[#e9e1ee] bg-white p-0 text-[#40364a] shadow-[0_28px_100px_rgba(47,29,62,.25)] sm:w-[calc(100%-3rem)]"
      >
        <div className="relative overflow-hidden rounded-t-[1.75rem] border-b border-[#eee8f2] bg-[linear-gradient(125deg,#fbf8fd_0%,#ffffff_55%,#f5f8f0_100%)] px-5 py-5 pr-14 sm:px-6 sm:py-6 sm:pr-16">
          <DialogClose
            aria-label="ปิดหน้าต่าง"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl border border-[#e8e1ec] bg-white/90 text-[#817888] shadow-sm transition hover:bg-[#f6f1f9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"
          >
            <X className="size-4" />
          </DialogClose>
          <DialogHeader className="text-left">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#6c4889] text-white shadow-[0_8px_20px_rgba(108,72,137,.22)]">
              <IdCard className="size-5" />
            </span>
            <DialogTitle className="pt-1 text-xl font-semibold text-[#382d43]">
              {person.cidRegistered ? "แก้ไข CID" : "เพิ่ม CID"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#817888]">
              ลงทะเบียน CID สำหรับ{" "}
              <span className="font-semibold text-[#5c4a68]">
                {person.fullName ?? person.name}
              </span>{" "}
              เพื่อให้ระบบจับคู่ ProviderID ได้
            </DialogDescription>
          </DialogHeader>
        </div>
        <form
          onSubmit={submit}
          noValidate
          className="space-y-4 px-5 py-5 sm:px-6"
        >
          {saveError && (
            <p
              role="alert"
              className="rounded-xl border border-[#f0d2cf] bg-[#fff5f3] px-3.5 py-3 text-sm leading-5 text-[#994d45]"
            >
              {saveError}
            </p>
          )}
          <FormField
            label="เลขประจำตัวประชาชน 13 หลัก"
            hint="ระบบตรวจ checksum ก่อนบันทึก และจะไม่แสดงเลขนี้ซ้ำ"
            error={form.formState.errors.cid?.message}
          >
            <Input
              inputMode="numeric"
              autoComplete="off"
              maxLength={13}
              {...form.register("cid", {
                onChange: (event) => {
                  event.target.value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 13);
                },
              })}
              className={`${inputClass} tracking-[.12em]`}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl border-[#e6dfeb]"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-11 rounded-xl bg-[#65418a] px-4 hover:bg-[#573576]"
            >
              {form.formState.isSubmitting ? (
                "กำลังบันทึก…"
              ) : (
                <>
                  <BadgeCheck className="size-4" />
                  บันทึก CID
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
