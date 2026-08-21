import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET(req) {
  const { error, session } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  let where = classId ? { classId } : {};

  if (session.user.role === "STAFF" && !classId) {
    where = { staffId: session.user.staffId };
  }

  if (session.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { id: session.user.studentId } });
    where = { classId: student?.classId };
  }

  const assignments = await prisma.assignment.findMany({
    where,
    include: { subject: true, class: true, staff: { include: { user: { select: { name: true } } } } },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(assignments);
}

export async function POST(req) {
  const { error, session } = await requireRole(["ADMIN", "STAFF"]);
  if (error) return error;

  const { title, description, classId, subjectId, dueDate } = await req.json();
  if (!title || !classId || !subjectId || !dueDate) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const staffId = session.user.staffId;
  if (!staffId) return NextResponse.json({ message: "Only staff can create assignments" }, { status: 403 });

  const created = await prisma.assignment.create({
    data: { title, description: description || null, classId, subjectId, staffId, dueDate: new Date(dueDate) },
    include: { subject: true, class: true },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req) {
  const { error } = await requireRole(["ADMIN", "STAFF"]);
  if (error) return error;

  const { id } = await req.json();
  await prisma.assignment.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
