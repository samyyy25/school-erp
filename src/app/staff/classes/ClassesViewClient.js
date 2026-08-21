"use client";

import { useState } from "react";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";

export default function ClassesViewClient({ subjects, students, initialAssignments }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", classId: subjects[0]?.classId || "", subjectId: subjects[0]?.id || "", dueDate: "" });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const data = await fetch("/api/assignments").then((r) => r.json());
    setAssignments(data);
  }

  async function createAssignment(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      setForm({ title: "", description: "", classId: subjects[0]?.classId || "", subjectId: subjects[0]?.id || "", dueDate: "" });
      refresh();
    }
  }

  async function deleteAssignment(id) {
    if (!confirm("Delete this assignment?")) return;
    await fetch("/api/assignments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="font-semibold mb-3">Assigned Subjects</h3>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <span key={s.id} className="text-xs bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
              {s.name} · {s.class.name}
            </span>
          ))}
          {subjects.length === 0 && <p className="text-xs text-gray-400">No subjects assigned yet — contact your admin.</p>}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Students</h3>
        <DataTable
          rows={students.map((s) => ({ ...s, name: s.user.name }))}
          searchKeys={["name", "admissionNo"]}
          columns={[
            { key: "name", header: "Name" },
            { key: "admissionNo", header: "Admission No." },
            { key: "class", header: "Class", render: (r) => `${r.class?.name || "-"} ${r.section?.name || ""}` },
          ]}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Assignments / Tasks</h3>
          <button onClick={() => setOpen(true)} className="btn-pill bg-[#111214] text-white text-xs">
            + New Assignment
          </button>
        </div>
        <DataTable
          rows={assignments}
          searchKeys={["title"]}
          columns={[
            { key: "title", header: "Title" },
            { key: "subject", header: "Subject", render: (r) => r.subject.name },
            { key: "class", header: "Class", render: (r) => r.class.name },
            { key: "dueDate", header: "Due Date", render: (r) => new Date(r.dueDate).toLocaleDateString() },
          ]}
          actions={(row) => (
            <button onClick={() => deleteAssignment(row.id)} className="text-xs text-red-400 hover:text-red-600">
              Delete
            </button>
          )}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Assignment">
        <form onSubmit={createAssignment} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Subject</label>
            <select required className="input" value={form.subjectId} onChange={(e) => {
              const subject = subjects.find((s) => s.id === e.target.value);
              setForm({ ...form, subjectId: e.target.value, classId: subject?.classId || "" });
            }}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.class.name})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input required type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-pill border border-gray-200">Cancel</button>
            <button type="submit" disabled={saving} className="btn-pill bg-[#111214] text-white disabled:opacity-60">
              {saving ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
