import { getSignedInProfile } from "@/lib/server-access";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ProfileEditor from "./profile-editor";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={<main className="loading-screen">กำลังโหลดโปรไฟล์…</main>}
    >
      <ProfilePageContent />
    </Suspense>
  );
}

async function ProfilePageContent() {
  const context = await getSignedInProfile();
  if (!context) redirect("/login");
  if (context.profile.mustChangePassword) redirect("/account/password");
  return <ProfileEditor />;
}
