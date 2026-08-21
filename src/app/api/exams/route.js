import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET(req) {
  const { error } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const exams = await prisma.exam.findMany({
    where: classId ? { classId } : {},
    include: { class: true, subject: true, _count: { select: { marks: true } } },
    orderBy: { examDate: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(req) {
  const { error } = await requireRole(["ADMIN", "STAFF"]);
  if (error) return error;

  const { name, classId, subjectId, examDate, maxMarks } = await req.json();
  if (!name || !classId || !subjectId || !examDate) {
    return NextResponse.json({ message: "name, classId, subjectId, and examDate are required" }, { status: 400 });
  }

  const exam = await prisma.exam.create({
    data: {
      name,
      classId,
      subjectId,
      examDate: new Date(examDate),
      maxMarks: maxMarks ? Number(maxMarks) : 100,
    },
    include: { class: true, subject: true },
  });

  return NextResponse.json(exam, { status: 201 });
}

export async function DELETE(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { id } = await req.json();
  await prisma.exam.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
