import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";

async function getAttendance(studentId) {
  const records = await prisma.attendance.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
  });
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const rate = records.length ? Math.round((present / records.length) * 100) : 0;
  return { records, present, absent, late, rate, total: records.length };
}

const STATUS_STYLES = {
  PRESENT: "bg-green-50 text-green-600",
  ABSENT: "bg-red-50 text-red-500",
  LATE: "bg-yellow-50 text-yellow-700",
};

export default async function StudentAttendancePage() {
  const session = await getServerSession(authOptions);
  const { records, present, absent, late, rate, total } = await getAttendance(session.user.studentId);

  return (
    <div>
      <Topbar title="Attendance" subtitle="Your attendance record" user={session.user} />

      <div className="grid gap-5 sm:grid-cols-4 mb-6">
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-1">Attendance Rate</p>
          <p className="text-2xl font-semibold">{rate}%</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-1">Present</p>
          <p className="text-2xl font-semibold text-green-600">{present}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-1">Absent</p>
          <p className="text-2xl font-semibold text-red-500">{absent}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-1">Late</p>
          <p className="text-2xl font-semibold text-yellow-600">{late}</p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4">History ({total} days recorded)</h3>
        <table className="table-base">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.date).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</td>
                <td>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center py-8 text-gray-400">No attendance recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
