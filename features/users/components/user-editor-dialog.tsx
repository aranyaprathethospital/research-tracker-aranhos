import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { UserDirectoryPerson as Person } from "@/features/users/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Check, IdCard, Plus, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { capabilityNames, inputClass, selectClass, FormField } from "./user-directory-fields";
import { capabilityValues, userFormSchema, type UserFormValues, type EditorMode, isValidThaiCid } from "./user-form-schema";

export function UserEditorDialog({
  mode,
  person,
  canAssignSystemRole,
  onOpenChange,
  onSave,
}: {
  mode: EditorMode;
  person?: Person;
  canAssignSystemRole: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    mode: EditorMode,
    person: Person | undefined,
    values: UserFormValues,
  ) => Promise<void>;
}) {
  const [saveError, setSaveError] = useState("");
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: person?.fullName ?? person?.name ?? "",
      cid: "",
      email: person?.email ?? "",
      position: person?.position ?? "",
      positionLevel: person?.positionLevel ?? "",
      mission: person?.mission ?? "",
      workGroup: person?.workGroup ?? "",
      systemRole:
        (person?.systemRole as UserFormValues["systemRole"] | undefined) ??
        "USER",
      capabilities: person?.capabilities.filter(
        (capability): capability is UserFormValues["capabilities"][number] =>
          capability === "ADVISEE" || capability === "ADVISOR",
      ) ?? ["ADVISEE"],
      active: person?.active !== false,
    },
  });
  const capabilities = useWatch({
    control: form.control,
    name: "capabilities",
  });
  const systemRole = useWatch({ control: form.control, name: "systemRole" });
  const active = useWatch({ control: form.control, name: "active" });
  const isSaving = form.formState.isSubmitting;

  const submit = form.handleSubmit(async (values) => {
    setSaveError("");
    if (mode === "create" && !isValidThaiCid(values.cid)) {
      form.setError("cid", {
        type: "validate",
        message: "กรุณากรอก CID 13 หลักให้ถูกต้อง",
      });
      return;
    }
    try {
      await onSave(mode, person, values);
      onOpenChange(false);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
    }
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="grid max-h-[92svh] w-[calc(100%-1rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-[1.75rem] border border-[#e9e1ee] bg-white p-0 text-[#40364a] shadow-[0_28px_100px_rgba(47,29,62,.25)] sm:w-[calc(100%-3rem)] sm:max-w-4xl lg:max-w-5xl"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-[#eee8f2] bg-white px-5 py-5 pr-14 sm:px-8 sm:py-6 sm:pr-16">
          <DialogClose
            aria-label="ปิดหน้าต่าง"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl border border-[#e8e1ec] bg-white/90 text-[#817888] shadow-sm transition hover:bg-[#f6f1f9] hover:text-[#5d3d79] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"
          >
            <X className="size-4" />
            <span className="sr-only">ปิดหน้าต่าง</span>
          </DialogClose>
          <DialogHeader className="relative gap-2 text-left">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f0e7f5] text-primary">
                <IdCard aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-semibold tracking-tight text-[#382d43] sm:text-2xl">
                  {mode === "create" ? "เพิ่มผู้ใช้ใหม่" : "แก้ไขข้อมูลผู้ใช้"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-5 text-[#817888]">
                  {mode === "create"
                    ? "ลงทะเบียน CID และกำหนดสิทธิ์ก่อนให้เข้า ProviderID"
                    : `จัดการข้อมูลและสิทธิ์ของ ${person?.fullName ?? person?.name ?? "ผู้ใช้"}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[#f8f6fa] px-4 py-4 sm:px-6 sm:py-6">
            {saveError && (
              <div
                role="alert"
                className="flex gap-3 rounded-2xl border border-[#f0d2cf] bg-[#fff5f3] px-4 py-3 text-sm leading-6 text-[#994d45]"
              >
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-[#fde7e3]">
                  <span className="text-base font-bold">!</span>
                </span>
                <p>{saveError}</p>
              </div>
            )}

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
              <div className="grid min-w-0 gap-4">
                <section className="min-w-0 space-y-4 rounded-2xl border border-border bg-white p-4 sm:p-5">
                  <h3 className="text-base font-semibold text-foreground">
                    ข้อมูลประจำตัว
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      label="ชื่อ-นามสกุล"
                      error={form.formState.errors.fullName?.message}
                      className={
                        mode === "create" ? undefined : "sm:col-span-2"
                      }
                    >
                      <Input
                        autoComplete="name"
                        {...form.register("fullName")}
                        className={inputClass}
                      />
                    </FormField>
                    {mode === "create" && (
                      <FormField
                        label="เลขบัตรประชาชน"
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
                          className={inputClass}
                        />
                      </FormField>
                    )}
                    <FormField
                      label="Email"
                      error={form.formState.errors.email?.message}
                      className="sm:col-span-2"
                    >
                      <Input
                        type="email"
                        autoComplete="email"
                        {...form.register("email")}
                        className={inputClass}
                      />
                    </FormField>
                  </div>
                </section>

                <section className="min-w-0 space-y-4 rounded-2xl border border-border bg-white p-4 sm:p-5">
                  <h3 className="text-base font-semibold text-foreground">
                    ข้อมูลการทำงาน{" "}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ไม่บังคับ
                    </span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      label="ตำแหน่ง"
                      error={form.formState.errors.position?.message}
                    >
                      <Input
                        {...form.register("position")}
                        className={inputClass}
                      />
                    </FormField>
                    <FormField
                      label="ระดับตำแหน่ง"
                      error={form.formState.errors.positionLevel?.message}
                    >
                      <Input
                        {...form.register("positionLevel")}
                        className={inputClass}
                      />
                    </FormField>
                    <FormField
                      label="ภารกิจ"
                      error={form.formState.errors.mission?.message}
                    >
                      <Input
                        {...form.register("mission")}
                        className={inputClass}
                      />
                    </FormField>
                    <FormField
                      label="กลุ่มงาน"
                      error={form.formState.errors.workGroup?.message}
                    >
                      <Input
                        {...form.register("workGroup")}
                        className={inputClass}
                      />
                    </FormField>
                  </div>
                  {mode === "edit" && person?.signatureUrl && (
                    <a
                      href={person.signatureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center rounded-xl border border-[#e9e2ed] bg-white px-3 text-sm font-semibold text-[#684783] transition hover:bg-[#faf7fc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#85619c]/15"
                    >
                      เปิดดูลายเซ็นที่บันทึกไว้
                    </a>
                  )}
                </section>
              </div>
              <section className="min-w-0 space-y-4 rounded-2xl border border-[#e7ddec] bg-white p-4 sm:p-5">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <ShieldCheck aria-hidden className="size-5 text-primary" />{" "}
                  สิทธิ์และการเข้าใช้งาน
                </h3>
                <div className="grid gap-4">
                  {canAssignSystemRole && (
                    <FormField
                      label="บทบาทระบบ"
                      error={form.formState.errors.systemRole?.message}
                    >
                      <select
                        {...form.register("systemRole")}
                        className={selectClass}
                      >
                        <option value="USER">ผู้ใช้ทั่วไป</option>
                        <option value="PM">PM · ผู้จัดการโครงการ</option>
                        <option value="SUPERADMIN">
                          Superadmin · ผู้ดูแลสูงสุด
                        </option>
                      </select>
                    </FormField>
                  )}
                  <fieldset className="min-w-0 rounded-2xl border border-[#e9e4ed] bg-[#fcfbfd] p-3.5 sm:p-4">
                    <legend className="px-1 text-sm font-semibold text-[#51465b]">
                      โหมดที่อนุญาต
                    </legend>
                    <div className="grid gap-2">
                      {capabilityValues.map((capability) => {
                        const checked = capabilities.includes(capability);
                        return (
                          <label
                            key={capability}
                            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 transition ${checked ? "border-[#d8c7e5] bg-[#f8f3fb]" : "border-[#eeeaf1] bg-white hover:border-[#e2d7ea]"}`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                const next =
                                  value === true
                                    ? [...capabilities, capability]
                                    : capabilities.filter(
                                        (item) => item !== capability,
                                      );
                                form.setValue("capabilities", next, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                              aria-label={`อนุญาตโหมด ${capabilityNames[capability]}`}
                              className="size-5 data-checked:border-[#6d4a8b] data-checked:bg-[#6d4a8b]"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#4e4358]">
                                {capabilityNames[capability]}
                              </span>
                              <span className="block text-xs text-[#8b8292]">
                                {capability === "ADVISEE"
                                  ? "ผู้ทำวิจัย"
                                  : "อาจารย์ที่ปรึกษา"}
                              </span>
                            </span>
                            {checked && (
                              <Check className="ml-auto size-4 text-[#6d4a8b]" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                    {form.formState.errors.capabilities?.message && (
                      <p className="mt-2 text-xs font-medium text-[#a44e43]">
                        {form.formState.errors.capabilities.message}
                      </p>
                    )}
                  </fieldset>
                </div>
                {mode === "edit" && (
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e9e4ed] bg-white px-4 py-3.5 transition hover:border-[#ded2e7]">
                    <Checkbox
                      checked={active}
                      onCheckedChange={(value) =>
                        form.setValue("active", value === true, {
                          shouldDirty: true,
                        })
                      }
                      aria-label="เปิดใช้งานบัญชีนี้"
                      className="size-5 data-checked:border-[#6d4a8b] data-checked:bg-[#6d4a8b]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#4e4358]">
                        เปิดใช้งานบัญชี
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-[#8b8292]">
                        เมื่อปิดใช้ ระบบจะยกเลิก session ทั้งหมด
                        หากมีโครงการผูกอยู่ต้องย้ายผู้รับผิดชอบก่อน
                      </span>
                    </span>
                    <Badge
                      variant="outline"
                      className={`shrink-0 rounded-full ${active ? "border-[#dcebd1] bg-[#eff7e9] text-[#4e702f]" : "border-[#f0d2cf] bg-[#fff3f1] text-[#a44e43]"}`}
                    >
                      {active ? "ใช้งาน" : "ปิดใช้"}
                    </Badge>
                  </label>
                )}
                {systemRole !== "USER" && (
                  <p className="rounded-xl bg-[#f8f5fa] px-3.5 py-3 text-xs leading-5 text-[#75697f]">
                    บัญชีผู้ดูแลระบบจัดการ Workspace ได้ตามบทบาท
                    แม้ไม่ได้เลือกโหมด Advisor หรือ Advisee
                  </p>
                )}
              </section>
            </div>
          </div>

          <div className="shrink-0 border-t border-[#eee9f1] bg-white px-5 py-3.5 shadow-[0_-8px_24px_-15px_rgba(47,29,62,.25)] sm:flex sm:items-center sm:justify-between sm:px-7">
            <p className="hidden items-center gap-2 text-xs leading-5 text-[#938a9a] sm:flex">
              <ShieldCheck className="size-4 shrink-0 text-[#78964d]" />
              ข้อมูล CID จะไม่ถูกแสดงซ้ำหลังบันทึก
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 rounded-xl border-[#e6dfeb] px-4 text-[#62576d]"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 min-w-32 rounded-xl bg-[#65418a] px-4 font-semibold shadow-[0_7px_16px_rgba(101,65,138,.15)] hover:bg-[#573576]"
              >
                {isSaving ? (
                  "กำลังบันทึก…"
                ) : mode === "create" ? (
                  <>
                    <Plus className="size-4" />
                    เพิ่มผู้ใช้
                  </>
                ) : (
                  <>
                    <BadgeCheck className="size-4" />
                    บันทึกข้อมูล
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
