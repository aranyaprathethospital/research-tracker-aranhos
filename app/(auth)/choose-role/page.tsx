import Loading from "./loading";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSignedInProfile } from "@/lib/server-access";
import RolePicker from "@/features/auth/components/role-picker";
import StatusPanel, { StatusLink } from "@/components/status/status-panel";

export default function ChooseRolePage() {
  return <Suspense fallback={<Loading />}><ChooseRolePageContent /></Suspense>;
}

async function ChooseRolePageContent() {
  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  const modes = context.profile.capabilities.map((grant) => grant.capability);
  if (modes.length === 1 || (context.profile.systemRole !== "USER" && modes.length === 0)) redirect("/");
  if (context.profile.mustChangePassword) redirect("/account/password");
  if (!modes.length) return <StatusPanel embedded kind="role" title="บัญชีนี้ยังไม่ได้รับบทบาท"
    description="กรุณาแจ้ง PM หรือผู้ดูแลระบบให้กำหนดบทบาท Advisor หรือ Advisee ให้บัญชีนี้ก่อนเริ่มใช้งาน">
    <StatusLink href="/profile">ดูข้อมูลบัญชี</StatusLink>
  </StatusPanel>;
  return <RolePicker modes={modes} />;
}
