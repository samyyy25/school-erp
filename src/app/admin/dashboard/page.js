import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import Link from "next/link";

async function getStats() {
  const [studentCount, staffCount, classCount] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.schoolClass.count(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [presentToday, totalMarkedToday] = await Promise.all([
    prisma.attendance.count({ where: { date: today, status: "PRESENT" } }),
    prisma.attendance.count({ where: { date: today } }),
  ]);

  const marks = await prisma.mark.findMany({ include: { exam: true } });
  const avgPerformance = marks.length
    ? Math.round(marks.reduce((sum, m) => sum + (m.marksObtained / (m.exam.maxMarks || 100)) * 100, 0) / marks.length)
    : 0;

  const recentNotices = await prisma.notice.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { postedBy: { select: { name: true } } },
  });

  const recentStudents = await prisma.student.findMany({
    orderBy: { admissionDate: "desc" },
    take: 5,
    include: { user: { select: { name: true } }, class: true, section: true },
  });

  return {
    studentCount,
    staffCount,
    classCount,
    attendanceRate: totalMarkedToday ? Math.round((presentToday / totalMarkedToday) * 100) : 0,
    avgPerformance,
    recentNotices,
    recentStudents,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const stats = await getStats();

  return (
    <div>
      <Topbar title="Dashboard" subtitle="School Overview" user={session.user} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard icon="👤" label="Students" value={stats.studentCount} sub="Total enrolled" color="yellow" />
        <StatCard icon="🧑‍🏫" label="Staff" value={stats.staffCount} sub="Teaching & support" color="pink" />
        <StatCard icon="🏫" label="Classes" value={stats.classCount} sub="Active classes" color="purple" />
        <StatCard icon="✅" label="Attendance Today" value={`${stats.attendanceRate}%`} sub="Marked so far" color="yellow" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3 mb-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recently Admitted Students</h3>
            <Link href="/admin/students" className="text-xs text-gray-400 hover:text-gray-700">
              View all →
            </Link>
          </div>
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Admission No.</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentStudents.map((s) => (
                <tr key={s.id}>
                  <td>{s.user.name}</td>
                  <td>{s.admissionNo}</td>
                  <td>
                    {s.class?.name} {s.section?.name}
                  </td>
                </tr>
              ))}
              {stats.recentStudents.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-400">
                    No students yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-1">Average Performance</h3>
          <p className="text-xs text-gray-400 mb-4">Across all recorded exams</p>
          <div className="text-4xl font-semibold mb-2">{stats.avgPerformance}%</div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-[#111214]" style={{ width: `${stats.avgPerformance}%` }} />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Notices</h3>
          <Link href="/admin/notices" className="text-xs text-gray-400 hover:text-gray-700">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {stats.recentNotices.map((n) => (
            <div key={n.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-gray-400">
                by {n.postedBy.name} · {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
          {stats.recentNotices.length === 0 && <p className="text-sm text-gray-400">No notices posted yet.</p>}
        </div>
      </div>
    </div>
  );
}
