import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";

async function getReportData() {
  const classes = await prisma.schoolClass.findMany({
    include: {
      sections: { include: { students: true } },
    },
    orderBy: { name: "asc" },
  });

  const report = [];
  for (const c of classes) {
    const studentIds = c.sections.flatMap((s) => s.students.map((st) => st.id));
    const attendance = await prisma.attendance.findMany({ where: { studentId: { in: studentIds } } });
    const present = attendance.filter((a) => a.status === "PRESENT").length;
    const attendanceRate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;

    const marks = await prisma.mark.findMany({ where: { studentId: { in: studentIds } }, include: { exam: true } });
    const avgPerformance = marks.length
      ? Math.round(marks.reduce((sum, m) => sum + (m.marksObtained / (m.exam.maxMarks || 100)) * 100, 0) / marks.length)
      : 0;

    report.push({
      className: c.name,
      studentCount: studentIds.length,
      attendanceRate,
      avgPerformance,
    });
  }

  const staffCount = await prisma.staff.count();
  const noticeCount = await prisma.notice.count();
  const examCount = await prisma.exam.count();

  return { report, staffCount, noticeCount, examCount };
}

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  const { report, staffCount, noticeCount, examCount } = await getReportData();

  return (
    <div>
      <Topbar title="Reports" subtitle="School-wide summary" user={session.user} />

      <div className="grid gap-5 sm:grid-cols-3 mb-6">
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-1">Total Staff</p>
          <p className="text-2xl font-semibold">{staffCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-1">Exams Conducted</p>
          <p className="text-2xl font-semibold">{examCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-1">Notices Published</p>
          <p className="text-2xl font-semibold">{noticeCount}</p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Class-wise Summary</h3>
        <table className="table-base">
          <thead>
            <tr>
              <th>Class</th>
              <th>Students</th>
              <th>Attendance Rate</th>
              <th>Avg. Performance</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r) => (
              <tr key={r.className}>
                <td>{r.className}</td>
                <td>{r.studentCount}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-green-400" style={{ width: `${r.attendanceRate}%` }} />
                    </div>
                    {r.attendanceRate}%
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-[#111214]" style={{ width: `${r.avgPerformance}%` }} />
                    </div>
                    {r.avgPerformance}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
