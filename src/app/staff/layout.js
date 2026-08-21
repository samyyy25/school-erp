import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RoleShell from "@/components/RoleShell";

export default async function StaffLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STAFF") {
    redirect("/login");
  }

  return <RoleShell role="staff">{children}</RoleShell>;
}
