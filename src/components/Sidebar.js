"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

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

function NavItems({ role, pathname, onNavigate }) {
  const items = NAV_BY_ROLE[role] || [];
  return (
    <>
      <p className="text-xs font-medium text-gray-400 px-1 mb-2">Main Menu</p>
      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 mt-4 w-full text-left"
      >
        <span aria-hidden>↩</span>
        Sign Out
      </button>
    </>
  );
}

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Mobile Header Bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 shadow-sm">
        <Link href={`/${role}/dashboard`} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#111214] flex items-center justify-center text-white text-sm font-bold">
            S
          </div>
          <span className="text-base font-semibold">Scholarly</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          {/* Hamburger icon */}
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative z-10 flex flex-col w-72 max-w-[85vw] bg-white h-full px-5 py-6 shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between mb-8">
              <Link href={`/${role}/dashboard`} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#111214] flex items-center justify-center text-white text-sm font-bold">
                  S
                </div>
                <span className="text-lg font-semibold">Scholarly</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <NavItems
              role={role}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar (unchanged) ── */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-gray-100 h-screen sticky top-0 px-5 py-6">
        <Link href={`/${role}/dashboard`} className="flex items-center gap-2 mb-8 px-1">
          <div className="h-8 w-8 rounded-lg bg-[#111214] flex items-center justify-center text-white text-sm font-bold">
            S
          </div>
          <span className="text-lg font-semibold">Scholarly</span>
        </Link>

        <NavItems role={role} pathname={pathname} onNavigate={() => {}} />
      </aside>
    </>
  );
}
