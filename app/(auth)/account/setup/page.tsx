import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSignedInProfile } from "@/lib/server-access";
import AccountSetupForm from "./setup-form";

export default function AccountSetupPage() {
  return <Suspense fallback={<main className="loading-screen">กำลังตรวจสอบบัญชี…</main>}><AccountSetupPageContent /></Suspense>;
}

async function AccountSetupPageContent() {
  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  const credential = await prisma.account.findFirst({ where: { userId: context.session.user.id, providerId: "credential" }, select: { id: true } });
  if (credential) redirect("/");
  return <AccountSetupForm initialName={context.profile.fullName} initialEmail={context.profile.email ?? ""} />;
}
