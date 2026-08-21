import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

// GET /api/attendance?sectionId=...&date=YYYY-MM-DD  -> attendance for a section on a date
// GET /api/attendance?studentId=...                  -> full history for one student
export async function GET(req) {
  const { error, session } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");
  const date = searchParams.get("date");
  let studentId = searchParams.get("studentId");

  if (session.user.role === "STUDENT") {
    studentId = session.user.studentId;
  }

  if (studentId) {
    const records = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(records);
  }

  if (sectionId && date) {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const students = await prisma.student.findMany({
      where: { sectionId },
      include: { user: { select: { name: true } } },
      orderBy: { admissionNo: "asc" },
    });

    const records = await prisma.attendance.findMany({
      where: { studentId: { in: students.map((s) => s.id) }, date: dateObj },
    });

    const merged = students.map((s) => {
      const rec = records.find((r) => r.studentId === s.id);
      return {
        studentId: s.id,
        name: s.user.name,
        admissionNo: s.admissionNo,
        status: rec?.status || null,
      };
    });

    return NextResponse.json(merged);
  }

  return NextResponse.json({ message: "sectionId+date or studentId is required" }, { status: 400 });
}

// POST { sectionId, date, entries: [{ studentId, status }] }
export async function POST(req) {
  const { error, session } = await requireRole(["ADMIN", "STAFF"]);
  if (error) return error;

  const { date, entries } = await req.json();
  if (!date || !Array.isArray(entries)) {
    return NextResponse.json({ message: "date and entries[] are required" }, { status: 400 });
  }

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const staffId = session.user.staffId || null;

  const results = await Promise.all(
    entries.map((e) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: e.studentId, date: dateObj } },
        update: { status: e.status, markedById: staffId },
        create: { studentId: e.studentId, date: dateObj, status: e.status, markedById: staffId },
      })
    )
  );

  return NextResponse.json({ message: "Attendance saved", count: results.length });
}
