"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const ICONS = {
  dashboard: "▦",
  students: "👤",
  staff: "🧑‍🏫",
  classes: "🏫",
  attendance: "✅",
  exams: "📝",
  marks: "🏆",
  notices: "📣",
  timetable: "🗓️",
  reports: "📊",
  settings: "⚙️",
  profile: "🪪",
};

const NAV_BY_ROLE = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/students", label: "Students", icon: "students" },
    { href: "/admin/staff", label: "Staff", icon: "staff" },
    { href: "/admin/classes", label: "Classes & Subjects", icon: "classes" },
    { href: "/admin/attendance", label: "Attendance", icon: "attendance" },
    { href: "/admin/exams", label: "Exams & Marks", icon: "exams" },
    { href: "/admin/timetable", label: "Timetable", icon: "timetable" },
    { href: "/admin/notices", label: "Notices", icon: "notices" },
    { href: "/admin/reports", label: "Reports", icon: "reports" },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
  ],
  staff: [
    { href: "/staff/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/staff/classes", label: "My Classes", icon: "classes" },
    { href: "/staff/attendance", label: "Attendance", icon: "attendance" },
    { href: "/staff/marks", label: "Marks & Results", icon: "marks" },
    { href: "/staff/timetable", label: "Timetable", icon: "timetable" },
    { href: "/staff/notices", label: "Notices", icon: "notices" },
    { href: "/staff/profile", label: "Profile", icon: "profile" },
  ],
  student: [
    { href: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/student/attendance", label: "Attendance", icon: "attendance" },
    { href: "/student/marks", label: "Marks & Results", icon: "marks" },
    { href: "/student/timetable", label: "Timetable", icon: "timetable" },
    { href: "/student/notices", label: "Notices", icon: "notices" },
    { href: "/student/profile", label: "Profile", icon: "profile" },
  ],
};

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role] || [];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-gray-100 h-screen sticky top-0 px-5 py-6">
      <Link href={`/${role}/dashboard`} className="flex items-center gap-2 mb-8 px-1">
        <div className="h-8 w-8 rounded-lg bg-[#111214] flex items-center justify-center text-white text-sm font-bold">
          S
        </div>
        <span className="text-lg font-semibold">Scholarly</span>
      </Link>

      <p className="text-xs font-medium text-gray-400 px-1 mb-2">Main Menu</p>
      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-[#111214] text-white font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span aria-hidden>{ICONS[item.icon]}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 mt-4"
      >
        <span aria-hidden>↩</span>
        Sign Out
      </button>
    </aside>
  );
}
