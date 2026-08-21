import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Topbar from "@/components/Topbar";
import ProfileForm from "@/components/ProfileForm";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <Topbar title="Settings" subtitle="Your account & school profile" user={session.user} />
      <ProfileForm user={session.user} />
    </div>
  );
}
