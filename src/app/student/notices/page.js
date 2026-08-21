import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import NoticesBoard from "@/components/NoticesBoard";

async function getNotices() {
  return prisma.notice.findMany({
    where: { audience: { in: ["ALL", "STUDENT"] } },
    include: { postedBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export default async function StudentNoticesPage() {
  const session = await getServerSession(authOptions);
  const notices = await getNotices();

  return (
    <div>
      <Topbar title="Notices" subtitle="School announcements" user={session.user} />
      <NoticesBoard initialNotices={notices} canPost={false} currentUserId={session.user.id} />
    </div>
  );
}
