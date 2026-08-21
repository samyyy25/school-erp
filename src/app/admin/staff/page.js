import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import StaffClient from "./StaffClient";

async function getData() {
  const [staff, subjects] = await Promise.all([
    prisma.staff.findMany({
      include: { user: true, teacherSubjects: { include: { subject: { include: { class: true } } } } },
      orderBy: { employeeId: "asc" },
    }),
    prisma.subject.findMany({ include: { class: true }, orderBy: { name: "asc" } }),
  ]);
  return { staff, subjects };
}

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  const { staff, subjects } = await getData();

  return (
    <div>
      <Topbar title="Staff" subtitle="Manage teachers & staff" user={session.user} />
      <StaffClient initialStaff={staff} subjects={subjects} />
    </div>
  );
}
