"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({ user, extraInfo }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", password: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setForm((f) => ({ ...f, password: "" }));
      router.refresh();
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="card p-6 lg:col-span-1">
        <div className="h-16 w-16 rounded-full bg-[#111214] text-white flex items-center justify-center text-xl font-semibold mb-4">
          {user.name?.[0]}
        </div>
        <p className="font-semibold">{user.name}</p>
        <p className="text-sm text-gray-400 mb-4">{user.email}</p>
        <span className="text-xs bg-gray-50 border border-gray-100 rounded-full px-3 py-1 capitalize">
          {user.role?.toLowerCase()}
        </span>
        {extraInfo && (
          <div className="mt-5 space-y-2 border-t border-gray-50 pt-4">
            {extraInfo.map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-400">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6 lg:col-span-2">
        <h3 className="font-semibold mb-4">Update Profile</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="Leave blank to keep current" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="col-span-2 flex items-center gap-3 mt-2">
            <button type="submit" disabled={saving} className="btn-pill bg-[#111214] text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && <span className="text-xs text-green-600">Saved ✓</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
