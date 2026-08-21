"use client";

export default function Topbar({ title, subtitle, user }) {
  const initials = (user?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 w-64 border border-gray-100">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            className="bg-transparent outline-none text-sm w-full placeholder:text-gray-400"
            placeholder="Search here..."
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center relative hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <span aria-hidden>🔔</span>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-[#111214] text-white flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
