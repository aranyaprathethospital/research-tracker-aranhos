import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { UserDirectoryPerson as Person } from "@/features/users/types";
import { Check, Clipboard, Copy, KeyRound, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ResetPasswordDialog({
  person,
  onOpenChange,
  onIssue,
}: {
  person: Person;
  onOpenChange: (open: boolean) => void;
  onIssue: (person: Person) => Promise<string>;
}) {
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const issue = async () => {
    setBusy(true);
    setError("");
    try {
      setTemporaryPassword(await onIssue(person));
      toast.success("ออกรหัสผ่านชั่วคราวแล้ว");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "ออกรหัสผ่านชั่วคราวไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      toast.success("คัดลอกรหัสผ่านแล้ว");
    } catch {
      toast.error("คัดลอกไม่ได้ กรุณาเลือกรหัสผ่านแล้วคัดลอกด้วยตนเอง");
    }
  };

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
            <span
              className={`grid size-11 place-items-center rounded-2xl ${temporaryPassword ? "bg-[#64853d]" : "bg-[#6c4889]"} text-white shadow-[0_8px_20px_rgba(108,72,137,.22)]`}
            >
              {temporaryPassword ? (
                <Check className="size-5" />
              ) : (
                <KeyRound className="size-5" />
              )}
            </span>
            <DialogTitle className="pt-1 text-xl font-semibold text-[#382d43]">
              {temporaryPassword
                ? "รหัสผ่านชั่วคราวพร้อมใช้"
                : "ออกรหัสผ่านชั่วคราว"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#817888]">
              บัญชีของ{" "}
              <span className="font-semibold text-[#5c4a68]">
                {person.fullName ?? person.name}
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-4 px-5 py-5 sm:px-6">
          {temporaryPassword ? (
            <>
              <div className="rounded-2xl border border-[#dfe9d4] bg-[#f6faF2] p-4">
                <p className="text-sm font-semibold text-[#4f6837]">
                  รหัสผ่านครั้งเดียว
                </p>
                <p className="mt-1 text-xs leading-5 text-[#718260]">
                  ส่งรหัสนี้ให้ผู้ใช้โดยตรง
                  ผู้ใช้จะต้องตั้งรหัสใหม่หลังเข้าสู่ระบบ และ session
                  เดิมถูกยกเลิกแล้ว
                </p>
                <div className="mt-3 flex gap-2">
                  <Input
                    readOnly
                    value={temporaryPassword}
                    aria-label="รหัสผ่านชั่วคราว"
                    className="h-12 border-[#dce7d2] bg-white text-lg font-semibold tabular-nums tracking-[.16em] text-[#354529]"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <Button
                    type="button"
                    onClick={() => void copyPassword()}
                    className="h-12 shrink-0 rounded-xl bg-[#64853d] px-3.5 text-white hover:bg-[#557332]"
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    <span className="sr-only">คัดลอกรหัสผ่าน</span>
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-[#eeeaf1] px-3.5 py-3 text-xs leading-5 text-[#83798b]">
                <Clipboard className="mt-0.5 size-4 shrink-0 text-[#8c7a9c]" />
                ปิดหน้าต่างแล้วรหัสจะไม่แสดงอีก หากทำหายให้ออกรหัสผ่านใหม่
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-11 w-full rounded-xl bg-[#65418a] hover:bg-[#573576] sm:w-auto"
                >
                  เรียบร้อย
                </Button>
              </div>
            </>
          ) : (
            <>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-[#f0d2cf] bg-[#fff5f3] px-3.5 py-3 text-sm leading-5 text-[#994d45]"
                >
                  {error}
                </p>
              )}
              <div className="rounded-2xl border border-[#eee8f2] bg-[#fbf9fc] p-4">
                <p className="text-sm font-semibold text-[#50445a]">
                  สิ่งที่จะเกิดขึ้น
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-5 text-[#786e81]">
                  <li className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#8c6aa6]" />
                    สร้างรหัสผ่านชั่วคราว 6 หลักให้คัดลอกส่งต่อ
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#8c6aa6]" />
                    ออกจากระบบทุกอุปกรณ์ของผู้ใช้ทันที
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#8c6aa6]" />
                    บังคับให้ตั้งรหัสใหม่หลังเข้าสู่ระบบ
                  </li>
                </ul>
              </div>
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
                  type="button"
                  disabled={busy}
                  onClick={() => void issue()}
                  className="h-11 rounded-xl bg-[#65418a] px-4 hover:bg-[#573576]"
                >
                  {busy ? (
                    "กำลังออกรหัส…"
                  ) : (
                    <>
                      <KeyRound className="size-4" />
                      ออกรหัสผ่าน
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
