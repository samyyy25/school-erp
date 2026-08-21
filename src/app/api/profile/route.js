import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET(req) {
  const { error, session } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      student: {
        include: {
          class: true,
          section: true,
        },
      },
      staff: {
        include: {
          teacherSubjects: {
            include: { subject: true },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req) {
  const { error, session } = await requireRole(["ADMIN", "STAFF", "STUDENT"]);
  if (error) return error;

  const body = await req.json();
  const { name, phone, currentPassword, newPassword, password, avatarUrl } = body;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const data = {};
  if (name) data.name = name.trim();
  if (phone !== undefined) data.phone = phone ? phone.trim() : null;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

  const targetPassword = newPassword || password;

  // If changing password, optionally verify current password if supplied
  if (targetPassword) {
    if (targetPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { message: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }
    data.password = await bcrypt.hash(targetPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}
