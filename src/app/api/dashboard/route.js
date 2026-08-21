import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export async function GET() {
  const { error, session } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const role = session.user.role;

  if (role === "ADMIN") {
    const [studentCount, staffCount, classCount, noticeCount] = await Promise.all([
      prisma.student.count(),
      prisma.staff.count(),
      prisma.schoolClass.count(),
      prisma.notice.count(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [presentToday, totalMarkedToday] = await Promise.all([
      prisma.attendance.count({ where: { date: today, status: "PRESENT" } }),
      prisma.attendance.count({ where: { date: today } }),
    ]);

    const marks = await prisma.mark.findMany({ include: { exam: true } });
    const avgPerformance = marks.length
      ? Math.round(
          marks.reduce((sum, m) => sum + (m.marksObtained / (m.exam.maxMarks || 100)) * 100, 0) / marks.length
        )
      : 0;

    const recentNotices = await prisma.notice.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { postedBy: { select: { name: true } } },
    });

    return NextResponse.json({
      studentCount,
      staffCount,
      classCount,
      noticeCount,
      attendanceRate: pct(presentToday, totalMarkedToday),
      avgPerformance,
      recentNotices,
    });
  }

  if (role === "STAFF") {
    const staff = await prisma.staff.findUnique({
      where: { id: session.user.staffId },
      include: { teacherSubjects: { include: { subject: { include: { class: true } } } } },
    });

    const classIds = [...new Set(staff.teacherSubjects.map((ts) => ts.subject.classId))];
    const studentCount = await prisma.student.count({ where: { classId: { in: classIds } } });

    const assignments = await prisma.assignment.findMany({
      where: { staffId: staff.id },
      include: { subject: true, class: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    const notices = await prisma.notice.findMany({
      where: { audience: { in: ["ALL", "STAFF"] } },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { postedBy: { select: { name: true } } },
    });

    const timetableToday = await prisma.timetable.findMany({
      where: { staffId: staff.id, day: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()] },
      include: { subject: true, class: true, section: true },
      orderBy: { period: "asc" },
    });

    return NextResponse.json({
      classCount: classIds.length,
      studentCount,
      subjectCount: staff.teacherSubjects.length,
      assignments,
      recentNotices: notices,
      timetableToday,
    });
  }

  // STUDENT
  const student = await prisma.student.findUnique({
    where: { id: session.user.studentId },
    include: { class: true, section: true },
  });

  const attendance = await prisma.attendance.findMany({ where: { studentId: student.id } });
  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = pct(present, attendance.length);

  const marks = await prisma.mark.findMany({
    where: { studentId: student.id },
    include: { exam: true, subject: true },
  });
  const avgPerformance = marks.length
    ? Math.round(
        marks.reduce((sum, m) => sum + (m.marksObtained / (m.exam.maxMarks || 100)) * 100, 0) / marks.length
      )
    : 0;

  const assignments = await prisma.assignment.findMany({
    where: { classId: student.classId },
    include: { subject: true },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  const totalAssignments = assignments.length;
  const completedAssignments = 0; // submission tracking not implemented in this prototype

  const notices = await prisma.notice.findMany({
    where: { audience: { in: ["ALL", "STUDENT"] } },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { postedBy: { select: { name: true } } },
  });

  return NextResponse.json({
    className: student.class?.name,
    sectionName: student.section?.name,
    attendanceRate,
    avgPerformance,
    assignments,
    assignmentProgress: pct(completedAssignments, totalAssignments || 1),
    recentNotices: notices,
    marks: marks.slice(0, 6),
  });
}
