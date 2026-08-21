import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET() {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const staff = await prisma.staff.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      teacherSubjects: { include: { subject: { include: { class: true } } } },
    },
    orderBy: { employeeId: "asc" },
  });

  return NextResponse.json(staff);
}

export async function POST(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const { name, email, password, employeeId, designation, qualification, subjectIds } = body;

  if (!name || !email || !password || !employeeId) {
    return NextResponse.json({ message: "Name, email, password, and employee ID are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const staff = await prisma.staff.create({
    data: {
      employeeId,
      designation: designation || null,
      qualification: qualification || null,
      user: {
        create: {
          name,
          email: email.toLowerCase().trim(),
          password: hashed,
          role: "STAFF",
        },
      },
      ...(subjectIds && subjectIds.length
        ? { teacherSubjects: { create: subjectIds.map((subjectId) => ({ subjectId })) } }
        : {}),
    },
    include: { user: true, teacherSubjects: { include: { subject: true } } },
  });

  return NextResponse.json(staff, { status: 201 });
}
