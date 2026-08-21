import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function getData(studentId) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student?.sectionId) return { entries: [] };

  const entries = await prisma.timetable.findMany({
    where: { sectionId: student.sectionId },
    include: { subject: true, staff: { include: { user: { select: { name: true } } } } },
    orderBy: [{ day: "asc" }, { period: "asc" }],
  });
  return { entries };
}

export default async function StudentTimetablePage() {
  const session = await getServerSession(authOptions);
  const { entries } = await getData(session.user.studentId);
  const maxPeriod = Math.max(4, ...entries.map((e) => e.period));

  return (
    <div>
      <Topbar title="Timetable" subtitle="Your weekly class schedule" user={session.user} />
      <div className="card p-5 overflow-x-auto">
        <table className="table-base min-w-[700px]">
          <thead>
            <tr>
              <th>Period</th>
              {DAYS.map((d) => <th key={d}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => (
              <tr key={p}>
                <td className="font-medium">P{p}</td>
                {DAYS.map((d) => {
                  const entry = entries.find((e) => e.day === d && e.period === p);
                  return (
                    <td key={d}>
                      {entry ? (
                        <div className="rounded-lg bg-gray-50 px-2 py-1.5 text-xs">
                          <p className="font-medium">{entry.subject.name}</p>
                          <p className="text-gray-400">{entry.staff.user.name}</p>
                          <p className="text-gray-400">{entry.startTime}-{entry.endTime}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No timetable published for your section yet.</p>}
      </div>
    </div>
  );
}
