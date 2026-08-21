import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET() {
  const { error, session } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const audienceFilter =
    session.user.role === "ADMIN"
      ? {}
      : session.user.role === "STAFF"
      ? { audience: { in: ["ALL", "STAFF"] } }
      : { audience: { in: ["ALL", "STUDENT"] } };

  const notices = await prisma.notice.findMany({
    where: audienceFilter,
    include: { postedBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notices);
}

export async function POST(req) {
  const { error, session } = await requireRole(["ADMIN", "STAFF"]);
  if (error) return error;

  const { title, content, audience } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ message: "Title and content are required" }, { status: 400 });
  }

  const notice = await prisma.notice.create({
    data: {
      title,
      content,
      audience: audience || "ALL",
      postedById: session.user.id,
    },
    include: { postedBy: { select: { name: true, role: true } } },
  });

  return NextResponse.json(notice, { status: 201 });
}

export async function DELETE(req) {
  const { error, session } = await requireRole(["ADMIN", "STAFF"]);
  if (error) return error;

  const { id } = await req.json();
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) return NextResponse.json({ message: "Not found" }, { status: 404 });

  if (session.user.role === "STAFF" && notice.postedById !== session.user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await prisma.notice.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
