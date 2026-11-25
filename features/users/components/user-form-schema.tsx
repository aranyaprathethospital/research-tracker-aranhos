import { z } from "zod";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const roleValues = ["USER", "PM", "SUPERADMIN"] as const;

export const capabilityValues = ["ADVISEE", "ADVISOR"] as const;

export const userFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "กรอกชื่อและนามสกุล")
      .max(160, "ชื่อยาวเกิน 160 ตัวอักษร"),
    cid: z.string().trim(),
    email: z
      .string()
      .trim()
      .max(254, "Email ยาวเกินกำหนด")
      .refine(
        (value) => !value || emailPattern.test(value),
        "รูปแบบ Email ไม่ถูกต้อง",
      ),
    position: z.string().trim().max(160, "ข้อมูลยาวเกิน 160 ตัวอักษร"),
    positionLevel: z.string().trim().max(160, "ข้อมูลยาวเกิน 160 ตัวอักษร"),
    mission: z.string().trim().max(160, "ข้อมูลยาวเกิน 160 ตัวอักษร"),
    workGroup: z.string().trim().max(160, "ข้อมูลยาวเกิน 160 ตัวอักษร"),
    systemRole: z.enum(roleValues),
    capabilities: z.array(z.enum(capabilityValues)).max(2),
    active: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.systemRole === "USER" && value.capabilities.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["capabilities"],
        message: "ผู้ใช้ทั่วไปต้องมีอย่างน้อยหนึ่งโหมด",
      });
    }
  });

export const cidFormSchema = z.object({
  cid: z.string().refine(isValidThaiCid, "กรุณาตรวจเลข CID 13 หลักอีกครั้ง"),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export type CidFormValues = z.infer<typeof cidFormSchema>;

export type EditorMode = "create" | "edit";

export function isValidThaiCid(value: string) {
  if (!/^\d{13}$/.test(value)) return false;
  const total = [...value.slice(0, 12)].reduce(
    (sum, digit, index) => sum + Number(digit) * (13 - index),
    0,
  );
  return (11 - (total % 11)) % 10 === Number(value[12]);
}
