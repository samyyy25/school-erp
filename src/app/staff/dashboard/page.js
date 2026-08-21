import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import Link from "next/link";

async function getData(staffId) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { teacherSubjects: { include: { subject: { include: { class: true } } } } },
  });

  const classIds = [...new Set(staff.teacherSubjects.map((ts) => ts.subject.classId))];
  const studentCount = await prisma.student.count({ where: { classId: { in: classIds } } });

  const today = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
  const timetableToday = await prisma.timetable.findMany({
    where: { staffId, day: today },
    include: { subject: true, class: true, section: true },
    orderBy: { period: "asc" },
  });

  const assignments = await prisma.assignment.findMany({
    where: { staffId },
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

  return {
    classCount: classIds.length,
    subjectCount: staff.teacherSubjects.length,
    studentCount,
    timetableToday,
    assignments,
    notices,
  };
}

export default async function StaffDashboard() {
  const session = await getServerSession(authOptions);
  const data = await getData(session.user.staffId);

  return (
    <div>
      <Topbar title="Dashboard" subtitle="Your teaching overview" user={session.user} />

      <div className="grid gap-5 sm:grid-cols-3 mb-6">
        <StatCard icon="🏫" label="My Classes" value={data.classCount} sub="Assigned classes" color="yellow" />
        <StatCard icon="📚" label="Subjects" value={data.subjectCount} sub="You teach" color="pink" />
        <StatCard icon="👤" label="Students" value={data.studentCount} sub="Across your classes" color="purple" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 mb-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Today's Timetable</h3>
          {data.timetableToday.length === 0 ? (
            <p className="text-sm text-gray-400">No classes scheduled today.</p>
          ) : (
            <div className="space-y-3">
              {data.timetableToday.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{t.subject.name}</p>
                    <p className="text-xs text-gray-400">{t.class.name} - {t.section.name}</p>
                  </div>
                  <span className="text-xs text-gray-400">{t.startTime} - {t.endTime}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Upcoming Assignments</h3>
            <Link href="/staff/classes" className="text-xs text-gray-400 hover:text-gray-700">View all →</Link>
          </div>
          {data.assignments.length === 0 ? (
            <p className="text-sm text-gray-400">No assignments posted yet.</p>
          ) : (
            <div className="space-y-3">
              {data.assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.subject.name} · {a.class.name}</p>
                  </div>
                  <span className="text-xs text-gray-400">Due {new Date(a.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Notices</h3>
          <Link href="/staff/notices" className="text-xs text-gray-400 hover:text-gray-700">View all →</Link>
        </div>
        <div className="space-y-3">
          {data.notices.map((n) => (
            <div key={n.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-gray-400">by {n.postedBy.name} · {new Date(n.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
          {data.notices.length === 0 && <p className="text-sm text-gray-400">No notices yet.</p>}
        </div>
      </div>
    </div>
  );
}
