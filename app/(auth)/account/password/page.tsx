import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSignedInProfile } from "@/lib/server-access";
import PasswordChangeForm from "@/features/auth/components/password-form";

export default function PasswordPage() {
  return <Suspense fallback={<main className="grid min-h-[60svh] place-items-center px-4 text-base text-[#777080]">กำลังตรวจสอบบัญชี…</main>}><PasswordPageContent /></Suspense>;
}

async function PasswordPageContent() {
  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  return <PasswordChangeForm forceChange={context.profile.mustChangePassword} />;
}
