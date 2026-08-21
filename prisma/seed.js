const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding PostgreSQL database for School ERP...");

  // ---- Clean up dynamic transaction tables if re-seeding ----
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.timetable.deleteMany({});
  await prisma.mark.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.staffAttendance.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});

  // ---- Users: Admin ----
  const adminPassword = await hash("Admin@123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: { password: adminPassword, name: "Ava Mitchell", role: "ADMIN", isActive: true },
    create: {
      name: "Ava Mitchell",
      email: "admin@school.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "9990000001",
    },
  });

  // ---- Classes & Sections ----
  const classNames = ["Grade 6", "Grade 7", "Grade 8"];
  const classes = {};
  for (const name of classNames) {
    classes[name] = await prisma.schoolClass.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const sections = {};
  for (const name of classNames) {
    for (const secName of ["A", "B"]) {
      const key = `${name}-${secName}`;
      sections[key] = await prisma.section.upsert({
        where: { classId_name: { classId: classes[name].id, name: secName } },
        update: {},
        create: { classId: classes[name].id, name: secName },
      });
    }
  }

  // ---- Subjects (per class) ----
  const subjectNames = ["Mathematics", "English", "Science", "Social Studies", "Art & Design"];
  const subjects = {};
  for (const cName of classNames) {
    for (const sName of subjectNames) {
      const key = `${cName}-${sName}`;
      subjects[key] = await prisma.subject.upsert({
        where: { classId_name: { classId: classes[cName].id, name: sName } },
        update: {},
        create: { classId: classes[cName].id, name: sName, code: sName.slice(0, 3).toUpperCase() },
      });
    }
  }

  // ---- Staff ----
  const staffData = [
    { name: "Daniel Cross", email: "daniel.cross@school.com", designation: "Mathematics Teacher", subj: "Mathematics" },
    { name: "Priya Nair", email: "priya.nair@school.com", designation: "English Teacher", subj: "English" },
    { name: "Marcus Lee", email: "marcus.lee@school.com", designation: "Science Teacher", subj: "Science" },
  ];

  const staffPassword = await hash("Staff@123");
  const staffRecords = [];
  for (let i = 0; i < staffData.length; i++) {
    const s = staffData[i];
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { password: staffPassword, name: s.name, role: "STAFF", isActive: true },
      create: {
        name: s.name,
        email: s.email,
        password: staffPassword,
        role: "STAFF",
        phone: `999000001${i}`,
      },
    });
    const staff = await prisma.staff.upsert({
      where: { userId: user.id },
      update: { designation: s.designation },
      create: {
        userId: user.id,
        employeeId: `EMP00${i + 1}`,
        designation: s.designation,
        qualification: "M.Ed",
      },
    });
    staffRecords.push({ staff, subj: s.subj });

    // Assign this teacher to their subject across all classes
    for (const cName of classNames) {
      const subject = subjects[`${cName}-${s.subj}`];
      await prisma.teacherSubject.upsert({
        where: { staffId_subjectId: { staffId: staff.id, subjectId: subject.id } },
        update: {},
        create: { staffId: staff.id, subjectId: subject.id },
      });
    }
  }

  // ---- Students ----
  const studentPassword = await hash("Student@123");
  const studentNames = [
    "Mithun Ray", "Sara Khan", "Leo Fischer", "Amara Osei", "Noah Becker",
    "Ivy Chen", "Ethan Brooks", "Zara Malik",
  ];
  const studentRecords = [];
  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}@school.com`;
    const cName = classNames[i % classNames.length];
    const secKey = `${cName}-${i % 2 === 0 ? "A" : "B"}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: { password: studentPassword, name, role: "STUDENT", isActive: true },
      create: {
        name,
        email,
        password: studentPassword,
        role: "STUDENT",
        phone: `988000000${i}`,
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: { classId: classes[cName].id, sectionId: sections[secKey].id },
      create: {
        userId: user.id,
        admissionNo: `2026-STU-${(i + 1).toString().padStart(3, "0")}`,
        classId: classes[cName].id,
        sectionId: sections[secKey].id,
        gender: i % 2 === 0 ? "Male" : "Female",
        guardianName: `Guardian of ${name}`,
        guardianPhone: `977000000${i}`,
      },
    });
    studentRecords.push({ student, cName });
  }

  // ---- Attendance (last 7 days) ----
  for (const { student } of studentRecords) {
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - d);
      const status = Math.random() > 0.12 ? "PRESENT" : (Math.random() > 0.5 ? "ABSENT" : "LATE");
      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: student.id, date } },
        update: { status },
        create: {
          studentId: student.id,
          date,
          status,
          markedById: staffRecords[0].staff.id,
        },
      });
    }
  }

  // ---- Exams + Marks ----
  for (const cName of classNames) {
    for (const sName of subjectNames.slice(0, 3)) {
      const subject = subjects[`${cName}-${sName}`];
      const exam = await prisma.exam.create({
        data: {
          name: "Mid-Term Examination",
          classId: classes[cName].id,
          subjectId: subject.id,
          examDate: new Date(),
          maxMarks: 100,
        },
      });
      const classStudents = studentRecords.filter((r) => r.cName === cName);
      for (const { student } of classStudents) {
        await prisma.mark.create({
          data: {
            examId: exam.id,
            studentId: student.id,
            subjectId: subject.id,
            marksObtained: Math.floor(55 + Math.random() * 45),
          },
        });
      }
    }
  }

  // ---- Notices ----
  await prisma.notice.createMany({
    data: [
      {
        title: "Annual Book Fair 2026",
        content: "Join us for the Annual Book Fair, a haven for book lovers of all ages. Stalls open all week in the main auditorium.",
        audience: "ALL",
        postedById: admin.id,
      },
      {
        title: "Mid-Term Exam Schedule Released",
        content: "The mid-term examination schedule has been officially published. Students can view their timetable in their portal.",
        audience: "STUDENT",
        postedById: admin.id,
      },
      {
        title: "Monthly Staff Review Meeting",
        content: "All faculty members are requested to attend the monthly academic review meeting this Friday at 4:00 PM.",
        audience: "STAFF",
        postedById: admin.id,
      },
    ],
  });

  // ---- Timetable (simple, Mon-Fri, 4 periods) ----
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const periodTimes = [
    ["09:00", "10:00"],
    ["10:00", "11:00"],
    ["11:15", "12:15"],
    ["13:00", "14:00"],
  ];
  for (const cName of classNames) {
    for (const secName of ["A", "B"]) {
      const section = sections[`${cName}-${secName}`];
      for (let d = 0; d < days.length; d++) {
        for (let p = 0; p < periodTimes.length; p++) {
          const rec = staffRecords[p % staffRecords.length];
          const subject = subjects[`${cName}-${rec.subj}`];
          await prisma.timetable.create({
            data: {
              classId: classes[cName].id,
              sectionId: section.id,
              day: days[d],
              period: p + 1,
              startTime: periodTimes[p][0],
              endTime: periodTimes[p][1],
              subjectId: subject.id,
              staffId: rec.staff.id,
            },
          });
        }
      }
    }
  }

  // ---- Assignments ----
  const firstClass = classes[classNames[0]];
  const firstSubject = subjects[`${classNames[0]}-Mathematics`];
  await prisma.assignment.create({
    data: {
      title: "Calculus & Geometry Worksheet",
      description: "Complete chapter 4 review exercises and submit online.",
      classId: firstClass.id,
      subjectId: firstSubject.id,
      staffId: staffRecords[0].staff.id,
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  });

  // ---- Sample Fees ----
  for (const { student } of studentRecords.slice(0, 4)) {
    await prisma.fee.create({
      data: {
        studentId: student.id,
        title: "Term 1 Tuition & Activity Fee",
        amount: 1250.0,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    });
  }

  console.log("Database seeded successfully!");
  console.log("-----------------------------------------");
  console.log("Admin:   admin@school.com         / Admin@123");
  console.log("Staff:   daniel.cross@school.com  / Staff@123");
  console.log("Student: mithun.ray@school.com    / Student@123");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
