import Sidebar from "./Sidebar";

export default function RoleShell({ role, children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar role={role} />
      <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8 max-w-[1600px]">{children}</main>
    </div>
  );
}
