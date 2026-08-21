"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";

const EMPTY_FORM = {
  id: null,
  name: "",
  email: "",
  password: "",
  employeeId: "",
  designation: "",
  qualification: "",
  subjectIds: [],
};

export default function StaffClient({ initialStaff, subjects }) {
  const router = useRouter();
  const [staff, setStaff] = useState(initialStaff);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setForm(EMPTY_FORM);
    setError("");
    setOpen(true);
  }

  function openEdit(s) {
    setForm({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      password: "",
      employeeId: s.employeeId,
      designation: s.designation || "",
      qualification: s.qualification || "",
      subjectIds: s.teacherSubjects.map((ts) => ts.subjectId),
    });
    setError("");
    setOpen(true);
  }

  function toggleSubject(id) {
    setForm((f) => ({
      ...f,
      subjectIds: f.subjectIds.includes(id) ? f.subjectIds.filter((x) => x !== id) : [...f.subjectIds, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const isEdit = !!form.id;
    const url = isEdit ? `/api/staff/${form.id}` : "/api/staff";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Something went wrong");
      return;
    }

    setOpen(false);
    router.refresh();
    const refreshed = await fetch("/api/staff").then((r) => r.json());
    setStaff(refreshed);
  }

  async function handleDelete(s) {
    if (!confirm(`Remove ${s.user.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/staff/${s.id}`, { method: "DELETE" });
    if (res.ok) {
      setStaff((prev) => prev.filter((x) => x.id !== s.id));
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="btn-pill bg-[#111214] text-white">
          + Add Staff
        </button>
      </div>

      <DataTable
        rows={staff.map((s) => ({ ...s, name: s.user.name, email: s.user.email }))}
        searchKeys={["name", "email", "employeeId", "designation"]}
        columns={[
          { key: "name", header: "Name" },
          { key: "employeeId", header: "Employee ID" },
          { key: "designation", header: "Designation" },
          {
            key: "subjects",
            header: "Subjects",
            render: (r) => r.teacherSubjects.map((ts) => ts.subject.name).join(", ") || "—",
          },
          { key: "email", header: "Email" },
        ]}
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <button onClick={() => openEdit(row)} className="text-xs text-gray-500 hover:text-gray-900">
              Edit
            </button>
            <button onClick={() => handleDelete(row)} className="text-xs text-red-400 hover:text-red-600">
              Delete
            </button>
          </div>
        )}
      />

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Edit Staff" : "Add Staff"} wide>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Full Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Employee ID</label>
            <input required className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Email</label>
            <input required type="email" disabled={!!form.id} className="input disabled:opacity-60" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          {!form.id && (
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Password</label>
              <input required type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          )}
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Designation</label>
            <input className="input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Qualification</label>
            <input className="input" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
          </div>

          <div className="col-span-2">
            <label className="label">Assigned Subjects</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-3">
              {subjects.map((sub) => (
                <button
                  type="button"
                  key={sub.id}
                  onClick={() => toggleSubject(sub.id)}
                  className={`text-xs rounded-full px-3 py-1.5 border ${
                    form.subjectIds.includes(sub.id)
                      ? "bg-[#111214] text-white border-[#111214]"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {sub.name} ({sub.class.name})
                </button>
              ))}
              {subjects.length === 0 && <p className="text-xs text-gray-400">No subjects yet — add classes/subjects first.</p>}
            </div>
          </div>

          {error && <p className="col-span-2 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-pill border border-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-pill bg-[#111214] text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
