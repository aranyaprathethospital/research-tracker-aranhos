import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSignedInProfile } from "@/lib/server-access";
import RolePicker from "./role-picker";

export default function ChooseRolePage() {
  return <Suspense fallback={<main className="loading-screen">กำลังโหลดโหมดทำงาน…</main>}><ChooseRolePageContent /></Suspense>;
}

async function ChooseRolePageContent() {
  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  const modes = context.profile.capabilities.map((grant) => grant.capability);
  if (modes.length === 1 || (context.profile.systemRole !== "USER" && modes.length === 0)) redirect("/");
  if (context.profile.mustChangePassword) redirect("/account/password");
  return <RolePicker modes={modes} />;
}
