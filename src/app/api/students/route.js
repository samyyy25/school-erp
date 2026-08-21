import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET(req) {
  const { error } = await requireRole(["ADMIN", "STAFF"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const sectionId = searchParams.get("sectionId");

  const students = await prisma.student.findMany({
    where: {
      ...(classId ? { classId } : {}),
      ...(sectionId ? { sectionId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      class: true,
      section: true,
    },
    orderBy: { admissionNo: "asc" },
  });

  return NextResponse.json(students);
}

export async function POST(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const { name, email, password, admissionNo, classId, sectionId, gender, dob, address, guardianName, guardianPhone } = body;

  if (!name || !email || !password || !admissionNo) {
    return NextResponse.json({ message: "Name, email, password, and admission number are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const student = await prisma.student.create({
    data: {
      admissionNo,
      classId: classId || null,
      sectionId: sectionId || null,
      gender: gender || null,
      dob: dob ? new Date(dob) : null,
      address: address || null,
      guardianName: guardianName || null,
      guardianPhone: guardianPhone || null,
      user: {
        create: {
          name,
          email: email.toLowerCase().trim(),
          password: hashed,
          role: "STUDENT",
        },
      },
    },
    include: { user: true, class: true, section: true },
  });

  return NextResponse.json(student, { status: 201 });
}
