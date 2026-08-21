import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import StaffMarksClient from "./StaffMarksClient";

async function getData(staffId) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { teacherSubjects: { include: { subject: { include: { class: true } } } } },
  });

  const subjectIds = staff.teacherSubjects.map((ts) => ts.subjectId);

  const exams = await prisma.exam.findMany({
    where: { subjectId: { in: subjectIds } },
    include: { class: true, subject: true, _count: { select: { marks: true } } },
    orderBy: { examDate: "desc" },
  });

  return { subjects: staff.teacherSubjects.map((ts) => ts.subject), exams };
}

export default async function StaffMarksPage() {
  const session = await getServerSession(authOptions);
  const { subjects, exams } = await getData(session.user.staffId);

  return (
    <div>
      <Topbar title="Marks & Results" subtitle="Create exams and enter student marks" user={session.user} />
      <StaffMarksClient subjects={subjects} initialExams={exams} />
    </div>
  );
}
