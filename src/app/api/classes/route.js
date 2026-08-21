import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET() {
  const { error } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const classes = await prisma.schoolClass.findMany({
    include: {
      sections: { include: { _count: { select: { students: true } } } },
      subjects: true,
      _count: { select: { subjects: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(classes);
}

export async function POST(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { name } = await req.json();
  if (!name) return NextResponse.json({ message: "Class name is required" }, { status: 400 });

  const existing = await prisma.schoolClass.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ message: "Class already exists" }, { status: 409 });

  const created = await prisma.schoolClass.create({ data: { name } });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { id } = await req.json();
  await prisma.schoolClass.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
