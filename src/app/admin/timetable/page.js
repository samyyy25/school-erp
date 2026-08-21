import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import TimetableClient from "./TimetableClient";

async function getData() {
  const [classes, staff] = await Promise.all([
    prisma.schoolClass.findMany({ include: { sections: true, subjects: true }, orderBy: { name: "asc" } }),
    prisma.staff.findMany({ include: { user: true }, orderBy: { employeeId: "asc" } }),
  ]);
  return { classes, staff };
}

export default async function AdminTimetablePage() {
  const session = await getServerSession(authOptions);
  const { classes, staff } = await getData();

  return (
    <div>
      <Topbar title="Timetable" subtitle="Build the weekly class timetable" user={session.user} />
      <TimetableClient classes={classes} staff={staff} />
    </div>
  );
}
