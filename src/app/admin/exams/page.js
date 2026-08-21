import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import ExamsClient from "./ExamsClient";

async function getData() {
  const [exams, classes] = await Promise.all([
    prisma.exam.findMany({
      include: { class: true, subject: true, _count: { select: { marks: true } } },
      orderBy: { examDate: "desc" },
    }),
    prisma.schoolClass.findMany({ include: { subjects: true }, orderBy: { name: "asc" } }),
  ]);
  return { exams, classes };
}

export default async function ExamsPage() {
  const session = await getServerSession(authOptions);
  const { exams, classes } = await getData();

  return (
    <div>
      <Topbar title="Exams & Marks" subtitle="Create exams and manage student results" user={session.user} />
      <ExamsClient initialExams={exams} classes={classes} />
    </div>
  );
}
