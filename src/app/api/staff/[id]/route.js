import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET(req, { params }) {
  const { error } = await requireRole(["ADMIN", "STAFF"]);
  if (error) return error;

  const staff = await prisma.staff.findUnique({
    where: { id: params.id },
    include: { user: true, teacherSubjects: { include: { subject: { include: { class: true } } } } },
  });

  if (!staff) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(staff);
}

export async function PUT(req, { params }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const { name, phone, employeeId, designation, qualification, isActive, subjectIds } = body;

  const staff = await prisma.staff.findUnique({ where: { id: params.id } });
  if (!staff) return NextResponse.json({ message: "Not found" }, { status: 404 });

  if (subjectIds) {
    await prisma.teacherSubject.deleteMany({ where: { staffId: params.id } });
  }

  const updated = await prisma.staff.update({
    where: { id: params.id },
    data: {
      employeeId,
      designation: designation || null,
      qualification: qualification || null,
      user: {
        update: {
          name,
          phone,
          ...(isActive !== undefined ? { isActive } : {}),
        },
      },
      ...(subjectIds ? { teacherSubjects: { create: subjectIds.map((subjectId) => ({ subjectId })) } } : {}),
    },
    include: { user: true, teacherSubjects: { include: { subject: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const staff = await prisma.staff.findUnique({ where: { id: params.id } });
  if (!staff) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await prisma.user.delete({ where: { id: staff.userId } });

  return NextResponse.json({ message: "Deleted" });
}
