import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

// GET /api/marks?examId=...            -> all students' marks for an exam
// GET /api/marks?studentId=...         -> all marks for a student (self, for student role)
export async function GET(req) {
  const { error, session } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  let studentId = searchParams.get("studentId");

  if (session.user.role === "STUDENT") {
    studentId = session.user.studentId;
  }

  if (examId) {
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { class: true, subject: true } });
    if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

    const students = await prisma.student.findMany({
      where: { classId: exam.classId },
      include: { user: { select: { name: true } } },
      orderBy: { admissionNo: "asc" },
    });

    const marks = await prisma.mark.findMany({ where: { examId } });

    const merged = students.map((s) => {
      const m = marks.find((mk) => mk.studentId === s.id);
      return {
        studentId: s.id,
        name: s.user.name,
        admissionNo: s.admissionNo,
        marksObtained: m?.marksObtained ?? null,
        maxMarks: exam.maxMarks,
      };
    });

    return NextResponse.json({ exam, rows: merged });
  }

  if (studentId) {
    const marks = await prisma.mark.findMany({
      where: { studentId },
      include: { subject: true, exam: true },
      orderBy: { exam: { examDate: "desc" } },
    });
    return NextResponse.json(marks);
  }

  return NextResponse.json({ message: "examId or studentId is required" }, { status: 400 });
}

// POST { examId, entries: [{ studentId, marksObtained }] }
export async function POST(req) {
  const { error } = await requireRole(["ADMIN", "STAFF"]);
  if (error) return error;

  const { examId, entries } = await req.json();
  if (!examId || !Array.isArray(entries)) {
    return NextResponse.json({ message: "examId and entries[] are required" }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

  const results = await Promise.all(
    entries
      .filter((e) => e.marksObtained !== null && e.marksObtained !== "")
      .map((e) =>
        prisma.mark.upsert({
          where: { examId_studentId: { examId, studentId: e.studentId } },
          update: { marksObtained: Number(e.marksObtained) },
          create: {
            examId,
            studentId: e.studentId,
            subjectId: exam.subjectId,
            marksObtained: Number(e.marksObtained),
          },
        })
      )
  );

  return NextResponse.json({ message: "Marks saved", count: results.length });
}
