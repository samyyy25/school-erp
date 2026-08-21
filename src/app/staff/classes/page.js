import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import ClassesViewClient from "./ClassesViewClient";

async function getData(staffId) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { teacherSubjects: { include: { subject: { include: { class: true } } } } },
  });

  const classIds = [...new Set(staff.teacherSubjects.map((ts) => ts.subject.classId))];

  const students = await prisma.student.findMany({
    where: { classId: { in: classIds } },
    include: { user: { select: { name: true } }, class: true, section: true },
    orderBy: { admissionNo: "asc" },
  });

  const assignments = await prisma.assignment.findMany({
    where: { staffId },
    include: { subject: true, class: true },
    orderBy: { dueDate: "asc" },
  });

  return { subjects: staff.teacherSubjects.map((ts) => ts.subject), students, assignments };
}

export default async function StaffClassesPage() {
  const session = await getServerSession(authOptions);
  const { subjects, students, assignments } = await getData(session.user.staffId);

  return (
    <div>
      <Topbar title="My Classes" subtitle="Your assigned classes, students & assignments" user={session.user} />
      <ClassesViewClient subjects={subjects} students={students} initialAssignments={assignments} />
    </div>
  );
}
