import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import PerformanceChart from "./PerformanceChart";

async function getData(studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true, section: true },
  });

  const attendance = await prisma.attendance.findMany({ where: { studentId }, orderBy: { date: "desc" } });
  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;

  const marks = await prisma.mark.findMany({
    where: { studentId },
    include: { exam: true, subject: true },
    orderBy: { exam: { examDate: "asc" } },
  });
  const avgPerformance = marks.length
    ? Math.round(marks.reduce((sum, m) => sum + (m.marksObtained / (m.exam.maxMarks || 100)) * 100, 0) / marks.length)
    : 0;

  const assignments = student.classId
    ? await prisma.assignment.findMany({
        where: { classId: student.classId },
        include: { subject: true },
        orderBy: { dueDate: "asc" },
      })
    : [];

  const notices = await prisma.notice.findMany({
    where: { audience: { in: ["ALL", "STUDENT"] } },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { postedBy: { select: { name: true } } },
  });

  return { student, attendanceRate, avgPerformance, marks, assignments, notices };
}

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  const { student, attendanceRate, avgPerformance, marks, assignments, notices } = await getData(session.user.studentId);

  const chartData = marks.slice(-6).map((m) => ({
    name: m.subject.name.slice(0, 3),
    score: Math.round((m.marksObtained / (m.exam.maxMarks || 100)) * 100),
  }));

  return (
    <div>
      <Topbar title="Dashboard" subtitle={`${student.class?.name || ""} ${student.section?.name || ""}`} user={session.user} />

      <div className="grid gap-5 sm:grid-cols-3 mb-6">
        <StatCard icon="🏆" label="Avg. Performance" value={`${avgPerformance}%`} sub={`Across ${marks.length} exams`} color="yellow" />
        <StatCard icon="✅" label="Attendance Rate" value={`${attendanceRate}%`} sub="Overall" color="pink" />
        <StatCard icon="📝" label="Assignments" value={assignments.length} sub="Total assigned" color="purple" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3 mb-6">
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold mb-1">Subject Performance</h3>
          <p className="text-xs text-gray-400 mb-4">Most recent exam scores by subject</p>
          {chartData.length > 0 ? <PerformanceChart data={chartData} /> : <p className="text-sm text-gray-400 py-10 text-center">No marks recorded yet.</p>}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Upcoming Assignments</h3>
          <div className="space-y-3">
            {assignments.slice(0, 5).map((a) => (
              <div key={a.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-gray-400">{a.subject.name} · Due {new Date(a.dueDate).toLocaleDateString()}</p>
              </div>
            ))}
            {assignments.length === 0 && <p className="text-sm text-gray-400">No assignments yet.</p>}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">Notices</h3>
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-gray-400">{n.postedBy.name} · {new Date(n.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
          {notices.length === 0 && <p className="text-sm text-gray-400">No notices yet.</p>}
        </div>
      </div>
    </div>
  );
}
