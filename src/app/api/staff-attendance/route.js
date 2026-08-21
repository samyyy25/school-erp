import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const staff = await prisma.staff.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { employeeId: "asc" },
  });

  if (!date) return NextResponse.json(staff);

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const records = await prisma.staffAttendance.findMany({
    where: { staffId: { in: staff.map((s) => s.id) }, date: dateObj },
  });

  const merged = staff.map((s) => {
    const rec = records.find((r) => r.staffId === s.id);
    return {
      staffId: s.id,
      name: s.user.name,
      employeeId: s.employeeId,
      status: rec?.status || null,
    };
  });

  return NextResponse.json(merged);
}

export async function POST(req) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { date, entries } = await req.json();
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const results = await Promise.all(
    entries.map((e) =>
      prisma.staffAttendance.upsert({
        where: { staffId_date: { staffId: e.staffId, date: dateObj } },
        update: { status: e.status },
        create: { staffId: e.staffId, date: dateObj, status: e.status },
      })
    )
  );

  return NextResponse.json({ message: "Saved", count: results.length });
}
