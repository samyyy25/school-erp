import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import AttendanceMarker from "@/components/AttendanceMarker";

async function getSections() {
  const sections = await prisma.section.findMany({
    include: { class: true },
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
  });
  return sections.map((s) => ({ id: s.id, name: s.name, className: s.class.name }));
}

export default async function AdminAttendancePage() {
  const session = await getServerSession(authOptions);
  const sections = await getSections();

  return (
    <div>
      <Topbar title="Attendance" subtitle="Mark and review student attendance" user={session.user} />
      {sections.length === 0 ? (
        <p className="text-sm text-gray-400">Add classes and sections first.</p>
      ) : (
        <AttendanceMarker sections={sections} />
      )}
    </div>
  );
}
