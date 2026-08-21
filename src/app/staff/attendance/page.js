import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import AttendanceMarker from "@/components/AttendanceMarker";

async function getSections(staffId) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { teacherSubjects: { include: { subject: { include: { class: true } } } } },
  });

  const classIds = [...new Set(staff.teacherSubjects.map((ts) => ts.subject.classId))];

  const sections = await prisma.section.findMany({
    where: { classId: { in: classIds } },
    include: { class: true },
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
  });

  return sections.map((s) => ({ id: s.id, name: s.name, className: s.class.name }));
}

export default async function StaffAttendancePage() {
  const session = await getServerSession(authOptions);
  const sections = await getSections(session.user.staffId);

  return (
    <div>
      <Topbar title="Attendance" subtitle="Mark attendance for your classes" user={session.user} />
      {sections.length === 0 ? (
        <p className="text-sm text-gray-400">You have no assigned classes yet.</p>
      ) : (
        <AttendanceMarker sections={sections} />
      )}
    </div>
  );
}
