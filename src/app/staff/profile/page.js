import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import ProfileForm from "@/components/ProfileForm";

async function getStaff(staffId) {
  return prisma.staff.findUnique({ where: { id: staffId } });
}

export default async function StaffProfilePage() {
  const session = await getServerSession(authOptions);
  const staff = await getStaff(session.user.staffId);

  return (
    <div>
      <Topbar title="Profile" subtitle="Your personal information" user={session.user} />
      <ProfileForm
        user={session.user}
        extraInfo={[
          { label: "Employee ID", value: staff.employeeId },
          { label: "Designation", value: staff.designation || "—" },
          { label: "Qualification", value: staff.qualification || "—" },
        ]}
      />
    </div>
  );
}
