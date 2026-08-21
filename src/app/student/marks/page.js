import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";

async function getMarks(studentId) {
  return prisma.mark.findMany({
    where: { studentId },
    include: { subject: true, exam: true },
    orderBy: { exam: { examDate: "desc" } },
  });
}

function gradeFor(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

export default async function StudentMarksPage() {
  const session = await getServerSession(authOptions);
  const marks = await getMarks(session.user.studentId);

  const avg = marks.length
    ? Math.round(marks.reduce((sum, m) => sum + (m.marksObtained / (m.exam.maxMarks || 100)) * 100, 0) / marks.length)
    : 0;

  return (
    <div>
      <Topbar title="Marks & Results" subtitle="Your examination performance" user={session.user} />

      <div className="grid gap-5 sm:grid-cols-3 mb-6">
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-1">Overall Average</p>
          <p className="text-2xl font-semibold">{avg}%</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-1">Overall Grade</p>
          <p className="text-2xl font-semibold">{gradeFor(avg)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-400 mb-1">Exams Recorded</p>
          <p className="text-2xl font-semibold">{marks.length}</p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Exam Results</h3>
        <table className="table-base">
          <thead>
            <tr>
              <th>Exam</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Marks</th>
              <th>%</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {marks.map((m) => {
              const pct = Math.round((m.marksObtained / (m.exam.maxMarks || 100)) * 100);
              return (
                <tr key={m.id}>
                  <td>{m.exam.name}</td>
                  <td>{m.subject.name}</td>
                  <td>{new Date(m.exam.examDate).toLocaleDateString()}</td>
                  <td>{m.marksObtained} / {m.exam.maxMarks}</td>
                  <td>{pct}%</td>
                  <td>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">{gradeFor(pct)}</span>
                  </td>
                </tr>
              );
            })}
            {marks.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No results published yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
