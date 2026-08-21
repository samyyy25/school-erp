import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET(req) {
  const { error, session } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");
  let staffId = searchParams.get("staffId");

  if (session.user.role === "STAFF" && !searchParams.get("all")) {
    staffId = session.user.staffId;
  }

  const timetable = await prisma.timetable.findMany({
    where: {
      ...(sectionId ? { sectionId } : {}),
      ...(staffId ? { staffId } : {}),
    },
    include: { subject: true, staff: { include: { user: { select: { name: true } } } }, class: true, section: true },
    orderBy: [{ day: "asc" }, { period: "asc" }],
  });

  return NextResponse.json(timetable);
}

export async function POST(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { classId, sectionId, day, period, startTime, endTime, subjectId, staffId } = await req.json();
  if (!classId || !sectionId || !day || !period || !subjectId || !staffId) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const created = await prisma.timetable.create({
    data: { classId, sectionId, day, period: Number(period), startTime, endTime, subjectId, staffId },
    include: { subject: true, staff: { include: { user: true } } },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { id } = await req.json();
  await prisma.timetable.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
