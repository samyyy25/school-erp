import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import StudentsClient from "./StudentsClient";

async function getData() {
  const [students, classes] = await Promise.all([
    prisma.student.findMany({
      include: { user: true, class: true, section: true },
      orderBy: { admissionNo: "asc" },
    }),
    prisma.schoolClass.findMany({ include: { sections: true }, orderBy: { name: "asc" } }),
  ]);
  return { students, classes };
}

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  const { students, classes } = await getData();

  return (
    <div>
      <Topbar title="Students" subtitle="Manage student records" user={session.user} />
      <StudentsClient initialStudents={students} classes={classes} />
    </div>
  );
}
