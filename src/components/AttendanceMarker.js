"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present", color: "bg-green-50 text-green-600 border-green-200" },
  { value: "LATE", label: "Late", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "ABSENT", label: "Absent", color: "bg-red-50 text-red-500 border-red-200" },
];

export default function AttendanceMarker({ sections }) {
  const [sectionId, setSectionId] = useState(sections[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!sectionId || !date) return;
    setLoading(true);
    setSaved(false);
    fetch(`/api/attendance?sectionId=${sectionId}&date=${date}`)
      .then((r) => r.json())
      .then((data) => setRows(data))
      .finally(() => setLoading(false));
  }, [sectionId, date]);

  function setStatus(studentId, status) {
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
    setSaved(false);
  }

  function markAll(status) {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const entries = rows.filter((r) => r.status).map((r) => ({ studentId: r.studentId, status: r.status }));
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, entries }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  const presentCount = rows.filter((r) => r.status === "PRESENT").length;

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <label className="label">Class / Section</label>
          <select className="input" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.className} - {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => markAll("PRESENT")} className="btn-pill border border-gray-200 text-xs">
            Mark all present
          </button>
          <button onClick={() => markAll("ABSENT")} className="btn-pill border border-gray-200 text-xs">
            Mark all absent
          </button>
        </div>
        <div className="ml-auto text-sm text-gray-400">
          {rows.length > 0 && `${presentCount}/${rows.length} present`}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading students...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No students found in this section.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Admission No.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.studentId}>
                  <td>{r.name}</td>
                  <td>{r.admissionNo}</td>
                  <td>
                    <div className="flex gap-2">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(r.studentId, opt.value)}
                          className={`text-xs rounded-full px-3 py-1.5 border ${
                            r.status === opt.value ? opt.color : "border-gray-200 text-gray-400"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-3 mt-5">
        <button onClick={save} disabled={saving || rows.length === 0} className="btn-pill bg-[#111214] text-white disabled:opacity-60">
          {saving ? "Saving..." : "Save Attendance"}
        </button>
        {saved && <span className="text-xs text-green-600">Saved ✓</span>}
      </div>
    </div>
  );
}
