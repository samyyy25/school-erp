import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import ClassesClient from "./ClassesClient";

async function getData() {
  const classes = await prisma.schoolClass.findMany({
    include: { sections: { include: { _count: { select: { students: true } } } }, subjects: true },
    orderBy: { name: "asc" },
  });
  return classes;
}

export default async function ClassesPage() {
  const session = await getServerSession(authOptions);
  const classes = await getData();

  return (
    <div>
      <Topbar title="Classes & Subjects" subtitle="Manage classes, sections and subjects" user={session.user} />
      <ClassesClient initialClasses={classes} />
    </div>
  );
}
