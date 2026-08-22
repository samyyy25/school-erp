import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role = "STUDENT",
      phone,
      admissionNo,
      employeeId,
      classId,
      sectionId,
    } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const validRoles = ["STUDENT", "STAFF", "ADMIN"];
    const targetRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : "STUDENT";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User record and associated Student or Staff profile
    let userData = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: targetRole,
      phone: phone || null,
    };

    if (targetRole === "STUDENT") {
      const generatedAdm = admissionNo || `STU-${Date.now().toString().slice(-6)}`;

      if (!classId || !sectionId) {
        return NextResponse.json(
          { message: "Class and section are required for student registration" },
          { status: 400 }
        );
      }

      // Verify class exists
      const schoolClass = await prisma.schoolClass.findUnique({
        where: { id: classId },
      });

      if (!schoolClass) {
        return NextResponse.json(
          { message: "Selected class does not exist" },
          { status: 400 }
        );
      }

      // Verify section exists and belongs to selected class
      const section = await prisma.section.findFirst({
        where: {
          id: sectionId,
          classId: classId,
        },
      });

      if (!section) {
        return NextResponse.json(
          { message: "Selected section does not belong to the selected class" },
          { status: 400 }
        );
      }

      userData.student = {
        create: {
          admissionNo: generatedAdm,
          classId,
          sectionId,
        },
      };
    } else if (targetRole === "STAFF") {
      const generatedEmp = employeeId || `EMP-${Date.now().toString().slice(-6)}`;
      userData.staff = {
        create: {
          employeeId: generatedEmp,
          designation: "Teacher",
        },
      };
    }

    const newUser = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
