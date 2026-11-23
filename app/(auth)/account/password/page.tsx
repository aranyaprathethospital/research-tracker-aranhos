import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSignedInProfile } from "@/lib/server-access";
import PasswordChangeForm from "./password-form";

export default function PasswordPage() {
  return <Suspense fallback={<main className="loading-screen">กำลังตรวจสอบบัญชี…</main>}><PasswordPageContent /></Suspense>;
}

async function PasswordPageContent() {
  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  return <PasswordChangeForm forceChange={context.profile.mustChangePassword} />;
}
