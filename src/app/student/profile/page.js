import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import ProfileForm from "@/components/ProfileForm";

async function getStudent(studentId) {
  return prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true, section: true },
  });
}

export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions);
  const student = await getStudent(session.user.studentId);

  return (
    <div>
      <Topbar title="Profile" subtitle="Your personal information" user={session.user} />
      <ProfileForm
        user={session.user}
        extraInfo={[
          { label: "Admission No.", value: student.admissionNo },
          { label: "Class", value: `${student.class?.name || "—"} ${student.section?.name || ""}` },
          { label: "Gender", value: student.gender || "—" },
          { label: "Guardian", value: student.guardianName || "—" },
          { label: "Guardian Phone", value: student.guardianPhone || "—" },
        ]}
      />
    </div>
  );
}
