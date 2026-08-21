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
  admissionNo: "",
  classId: "",
  sectionId: "",
  gender: "",
  guardianName: "",
  guardianPhone: "",
  address: "",
};

export default function StudentsClient({ initialStudents, classes }) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sectionsForClass = classes.find((c) => c.id === form.classId)?.sections || [];

  function openAdd() {
    setForm(EMPTY_FORM);
    setError("");
    setOpen(true);
  }

  function openEdit(student) {
    setForm({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      password: "",
      admissionNo: student.admissionNo,
      classId: student.classId || "",
      sectionId: student.sectionId || "",
      gender: student.gender || "",
      guardianName: student.guardianName || "",
      guardianPhone: student.guardianPhone || "",
      address: student.address || "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const isEdit = !!form.id;
    const url = isEdit ? `/api/students/${form.id}` : "/api/students";
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
    const refreshed = await fetch("/api/students").then((r) => r.json());
    setStudents(refreshed);
  }

  async function handleDelete(student) {
    if (!confirm(`Remove ${student.user.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
    if (res.ok) {
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="btn-pill bg-[#111214] text-white">
          + Add Student
        </button>
      </div>

      <DataTable
        rows={students.map((s) => ({ ...s, name: s.user.name, email: s.user.email }))}
        searchKeys={["name", "email", "admissionNo"]}
        columns={[
          { key: "name", header: "Name" },
          { key: "admissionNo", header: "Admission No." },
          { key: "class", header: "Class", render: (r) => `${r.class?.name || "-"} ${r.section?.name || ""}` },
          { key: "email", header: "Email" },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <span className={`text-xs px-2 py-1 rounded-full ${r.user.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                {r.user.isActive ? "Active" : "Inactive"}
              </span>
            ),
          },
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

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Edit Student" : "Add Student"} wide>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Full Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Admission No.</label>
            <input required className="input" value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} />
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
            <label className="label">Class</label>
            <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "" })}>
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Section</label>
            <select className="input" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
              <option value="">Select section</option>
              {sectionsForClass.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Guardian Name</label>
            <input className="input" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Guardian Phone</label>
            <input className="input" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
