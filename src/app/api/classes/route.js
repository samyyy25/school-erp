import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET() {
  try {
    const classes = await prisma.schoolClass.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sections: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Failed to fetch classes:", error);

    return NextResponse.json(
      { message: "Failed to load classes" },
      { status: 500 }
    );
  }
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
