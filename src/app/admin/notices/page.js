import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import NoticesBoard from "@/components/NoticesBoard";

async function getNotices() {
  return prisma.notice.findMany({
    include: { postedBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminNoticesPage() {
  const session = await getServerSession(authOptions);
  const notices = await getNotices();

  return (
    <div>
      <Topbar title="Notices" subtitle="Publish announcements to staff and students" user={session.user} />
      <NoticesBoard initialNotices={notices} canPost currentUserId={session.user.id} />
    </div>
  );
}
