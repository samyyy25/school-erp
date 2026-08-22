import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// OpenRouter endpoint — mirrors Gemini/GPT/Claude via a reliable proxy.
// Free tier available at https://openrouter.ai (sign up, no credit card needed for free models)
const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";
// Using google/gemini-flash-1.5 on OpenRouter (free tier model)
const MODEL = "google/gemini-flash-1.5";

// ─── Role-specific DB context fetchers ────────────────────────────────────

async function getStudentContext(userId) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true } },
      class: { select: { name: true } },
      section: { select: { name: true } },
      marks: {
        take: 20,
        orderBy: { exam: { examDate: "desc" } },
        include: {
          exam: { select: { name: true, examDate: true, maxMarks: true } },
          subject: { select: { name: true } },
        },
      },
      attendance: {
        take: 30,
        orderBy: { date: "desc" },
        select: { date: true, status: true },
      },
      fees: {
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        select: { title: true, amount: true, dueDate: true, status: true },
      },
    },
  });

  if (!student) return "No student profile found.";

  const totalAtt = student.attendance.length;
  const presentCount = student.attendance.filter((a) => a.status === "PRESENT").length;
  const attPct = totalAtt > 0 ? ((presentCount / totalAtt) * 100).toFixed(1) : "N/A";
  const marksSummary = student.marks
    .map((m) => `${m.subject.name} (${m.exam.name}): ${m.marksObtained}/${m.exam.maxMarks}`)
    .join(", ");
  const pendingFees = student.fees
    .map((f) => `${f.title}: Rs.${f.amount} (${f.status}, due ${new Date(f.dueDate).toDateString()})`)
    .join("; ");

  return `Student: ${student.user.name}
Class: ${student.class?.name || "N/A"}, Section: ${student.section?.name || "N/A"}
Admission No: ${student.admissionNo}
Attendance (last 30 days): ${presentCount}/${totalAtt} present (${attPct}%)
Recent Marks: ${marksSummary || "No marks yet"}
Pending Fees: ${pendingFees || "None"}`;
}

async function getStaffContext(userId) {
  const staff = await prisma.staff.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true } },
      teacherSubjects: {
        include: { subject: { include: { class: { select: { name: true } } } } },
      },
      timetable: {
        take: 20,
        include: {
          class: { select: { name: true } },
          subject: { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: { period: "asc" },
      },
      staffAttendance: {
        take: 20,
        orderBy: { date: "desc" },
        select: { date: true, status: true },
      },
    },
  });

  if (!staff) return "No staff profile found.";

  const subjects = staff.teacherSubjects
    .map((ts) => `${ts.subject.name} (${ts.subject.class?.name || "N/A"})`)
    .join(", ");
  const timetable = staff.timetable
    .map((t) => `${t.day} Period ${t.period}: ${t.subject.name} - ${t.class.name} ${t.section.name}`)
    .join("; ");
  const present = staff.staffAttendance.filter((a) => a.status === "PRESENT").length;

  return `Staff: ${staff.user.name}
Employee ID: ${staff.employeeId}, Designation: ${staff.designation || "N/A"}
Subjects: ${subjects || "None"}
Timetable: ${timetable || "No entries"}
Attendance (last 20 days): ${present}/${staff.staffAttendance.length} present`;
}

async function getAdminContext() {
  const [students, staffCount, fees, notices, classes] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.fee.aggregate({ _sum: { amount: true }, where: { status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.notice.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { title: true, audience: true } }),
    prisma.schoolClass.count(),
  ]);

  return `School Overview:
- Students: ${students}, Staff: ${staffCount}, Classes: ${classes}
- Pending/Overdue Fees Total: Rs.${fees._sum.amount?.toFixed(2) || "0"}
- Recent Notices: ${notices.map((n) => `"${n.title}" (${n.audience})`).join("; ") || "None"}`;
}

// ─── POST /api/ai-chat ─────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply:
          "The AI assistant needs an API key to work.\n\nPlease add your **OpenRouter API key** to `.env`:\n```\nOPENROUTER_API_KEY=\"sk-or-...\"\n```\nGet a **free key** (no credit card) at: https://openrouter.ai",
      });
    }

    const userId = session.user.id;
    const role = session.user.role?.toLowerCase();
    const userName = session.user.name || "User";

    // 1. Fetch role-specific DB context
    let dbContext = "";
    try {
      if (role === "student") dbContext = await getStudentContext(userId);
      else if (role === "staff") dbContext = await getStaffContext(userId);
      else if (role === "admin") dbContext = await getAdminContext();
    } catch (e) {
      console.error("DB context error:", e);
      dbContext = "School data temporarily unavailable.";
    }

    // 2. Load last 20 messages from DB
    const historyRows = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    // 3. Build system prompt
    const systemPrompt = `You are a helpful, friendly AI school assistant for "Scholarly", a school management portal.
You assist ${role}s with their school-related queries. Be concise, accurate, and supportive.
Use bullet points for lists. Today: ${new Date().toDateString()}.
User: ${userName} (${role?.toUpperCase()})

Live school data for this user:
${dbContext}

Answer questions using the data above when relevant. For general educational questions, use your knowledge.`;

    // 4. Build messages array (OpenAI-compatible format used by OpenRouter)
    const messages = [
      { role: "system", content: systemPrompt },
      ...historyRows.map((row) => ({
        role: row.role === "model" ? "assistant" : "user",
        content: row.content,
      })),
      { role: "user", content: message.trim() },
    ];

    // 5. Call OpenRouter (OpenAI-compatible REST API — works through network blocks)
    const response = await fetch(OPENROUTER_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "Scholarly School ERP",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter error:", response.status, errText);
      return NextResponse.json(
        { error: `AI provider error (${response.status}). Please try again.` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I could not generate a response. Please try again.";

    // 6. Persist both messages to DB
    await prisma.chatMessage.createMany({
      data: [
        { userId, role: "user", content: message.trim() },
        { userId, role: "model", content: reply },
      ],
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI Chat Error:", error);

    // Friendly network error message
    const isNetworkError =
      error?.code === "ECONNRESET" ||
      error?.cause?.code === "ECONNRESET" ||
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNRESET");

    const reply = isNetworkError
      ? "Network connection issue — could not reach the AI service. Please check your internet connection or try using a VPN/proxy."
      : "Something went wrong. Please try again in a moment.";

    return NextResponse.json({ error: reply }, { status: 500 });
  }
}
