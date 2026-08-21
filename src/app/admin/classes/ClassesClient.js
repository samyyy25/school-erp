"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClassesClient({ initialClasses }) {
  const router = useRouter();
  const [classes, setClasses] = useState(initialClasses);
  const [newClass, setNewClass] = useState("");
  const [sectionInputs, setSectionInputs] = useState({});
  const [subjectInputs, setSubjectInputs] = useState({});

  async function refresh() {
    const data = await fetch("/api/classes").then((r) => r.json());
    setClasses(data);
    router.refresh();
  }

  async function addClass(e) {
    e.preventDefault();
    if (!newClass.trim()) return;
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newClass.trim() }),
    });
    if (res.ok) {
      setNewClass("");
      refresh();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  }

  async function deleteClass(id) {
    if (!confirm("Delete this class and all its sections/subjects?")) return;
    await fetch("/api/classes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  async function addSection(classId) {
    const name = (sectionInputs[classId] || "").trim();
    if (!name) return;
    const res = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, name }),
    });
    if (res.ok) {
      setSectionInputs((s) => ({ ...s, [classId]: "" }));
      refresh();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  }

  async function deleteSection(id) {
    if (!confirm("Delete this section?")) return;
    await fetch("/api/sections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  async function addSubject(classId) {
    const name = (subjectInputs[classId] || "").trim();
    if (!name) return;
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, name }),
    });
    if (res.ok) {
      setSubjectInputs((s) => ({ ...s, [classId]: "" }));
      refresh();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  }

  async function deleteSubject(id) {
    if (!confirm("Delete this subject?")) return;
    await fetch("/api/subjects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={addClass} className="card p-5 flex items-end gap-3">
        <div className="flex-1 max-w-xs">
          <label className="label">New Class Name</label>
          <input className="input" placeholder="e.g. Grade 9" value={newClass} onChange={(e) => setNewClass(e.target.value)} />
        </div>
        <button type="submit" className="btn-pill bg-[#111214] text-white">+ Add Class</button>
      </form>

      <div className="grid gap-5 lg:grid-cols-2">
        {classes.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{c.name}</h3>
              <button onClick={() => deleteClass(c.id)} className="text-xs text-red-400 hover:text-red-600">
                Delete Class
              </button>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-400 mb-2">Sections</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {c.sections.map((s) => (
                  <span key={s.id} className="text-xs bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 flex items-center gap-2">
                    {s.name} <span className="text-gray-400">({s._count.students})</span>
                    <button onClick={() => deleteSection(s.id)} className="text-gray-300 hover:text-red-500">✕</button>
                  </span>
                ))}
                {c.sections.length === 0 && <span className="text-xs text-gray-400">No sections yet.</span>}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Section name e.g. A"
                  value={sectionInputs[c.id] || ""}
                  onChange={(e) => setSectionInputs((s) => ({ ...s, [c.id]: e.target.value }))}
                />
                <button onClick={() => addSection(c.id)} className="btn-pill border border-gray-200 whitespace-nowrap">
                  + Add
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">Subjects</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {c.subjects.map((s) => (
                  <span key={s.id} className="text-xs bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 flex items-center gap-2">
                    {s.name}
                    <button onClick={() => deleteSubject(s.id)} className="text-gray-300 hover:text-red-500">✕</button>
                  </span>
                ))}
                {c.subjects.length === 0 && <span className="text-xs text-gray-400">No subjects yet.</span>}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Subject name e.g. Physics"
                  value={subjectInputs[c.id] || ""}
                  onChange={(e) => setSubjectInputs((s) => ({ ...s, [c.id]: e.target.value }))}
                />
                <button onClick={() => addSubject(c.id)} className="btn-pill border border-gray-200 whitespace-nowrap">
                  + Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
