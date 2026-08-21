import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function POST(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { name, classId } = await req.json();
  if (!name || !classId) {
    return NextResponse.json({ message: "Section name and classId are required" }, { status: 400 });
  }

  const existing = await prisma.section.findUnique({ where: { classId_name: { classId, name } } });
  if (existing) return NextResponse.json({ message: "Section already exists for this class" }, { status: 409 });

  const created = await prisma.section.create({ data: { name, classId } });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { id } = await req.json();
  await prisma.section.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
