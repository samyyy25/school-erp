import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET(req) {
  const { error } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const subjects = await prisma.subject.findMany({
    where: classId ? { classId } : {},
    include: { class: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(subjects);
}

export async function POST(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { name, code, classId } = await req.json();
  if (!name || !classId) {
    return NextResponse.json({ message: "Subject name and classId are required" }, { status: 400 });
  }

  const existing = await prisma.subject.findUnique({ where: { classId_name: { classId, name } } });
  if (existing) return NextResponse.json({ message: "Subject already exists for this class" }, { status: 409 });

  const created = await prisma.subject.create({ data: { name, code: code || null, classId } });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { id } = await req.json();
  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
