import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET(req, { params }) {
  const { error, session } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  if (session.user.role === "STUDENT" && session.user.studentId !== params.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: { user: true, class: true, section: true },
  });

  if (!student) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PUT(req, { params }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const { name, phone, admissionNo, classId, sectionId, gender, dob, address, guardianName, guardianPhone, isActive } = body;

  const student = await prisma.student.findUnique({ where: { id: params.id } });
  if (!student) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const updated = await prisma.student.update({
    where: { id: params.id },
    data: {
      admissionNo,
      class: classId ? { connect: { id: classId } } : { disconnect: true },
      section: sectionId ? { connect: { id: sectionId } } : { disconnect: true },
      gender: gender || null,
      dob: dob ? new Date(dob) : null,
      address: address || null,
      guardianName: guardianName || null,
      guardianPhone: guardianPhone || null,
      user: {
        update: {
          name,
          phone,
          ...(isActive !== undefined ? { isActive } : {}),
        },
      },
    },
    include: { user: true, class: true, section: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const student = await prisma.student.findUnique({ where: { id: params.id } });
  if (!student) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await prisma.user.delete({ where: { id: student.userId } }); // cascades to student

  return NextResponse.json({ message: "Deleted" });
}
