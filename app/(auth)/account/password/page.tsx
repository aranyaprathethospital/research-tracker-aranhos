import Loading from "./loading";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSignedInProfile } from "@/lib/server-access";
import PasswordChangeForm from "@/features/auth/components/password-form";

export default function PasswordPage() {
  return <Suspense fallback={<Loading />}><PasswordPageContent /></Suspense>;
}

async function PasswordPageContent() {
  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  return <PasswordChangeForm forceChange={context.profile.mustChangePassword} />;
}
