"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EMPTY_FORM = { day: "Mon", period: 1, startTime: "09:00", endTime: "10:00", subjectId: "", staffId: "" };

export default function TimetableClient({ classes, staff }) {
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [sectionId, setSectionId] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const currentClass = classes.find((c) => c.id === classId);
  const sections = currentClass?.sections || [];
  const subjects = currentClass?.subjects || [];

  useEffect(() => {
    if (sections.length && !sectionId) setSectionId(sections[0].id);
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    fetch(`/api/timetable?sectionId=${sectionId}`)
      .then((r) => r.json())
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [sectionId]);

  async function refresh() {
    const data = await fetch(`/api/timetable?sectionId=${sectionId}`).then((r) => r.json());
    setEntries(data);
  }

  async function addEntry(e) {
    e.preventDefault();
    const res = await fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, classId, sectionId }),
    });
    if (res.ok) {
      setOpen(false);
      setForm(EMPTY_FORM);
      refresh();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  }

  async function deleteEntry(id) {
    if (!confirm("Remove this period?")) return;
    await fetch("/api/timetable", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  const maxPeriod = Math.max(4, ...entries.map((e) => e.period));

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <label className="label">Class</label>
          <select className="input" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Section</label>
          <select className="input" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button onClick={() => setOpen(true)} className="btn-pill bg-[#111214] text-white ml-auto">
          + Add Period
        </button>
      </div>

      <div className="card p-5 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading timetable...</p>
        ) : (
          <table className="table-base min-w-[700px]">
            <thead>
              <tr>
                <th>Period</th>
                {DAYS.map((d) => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => (
                <tr key={p}>
                  <td className="font-medium">P{p}</td>
                  {DAYS.map((d) => {
                    const entry = entries.find((e) => e.day === d && e.period === p);
                    return (
                      <td key={d}>
                        {entry ? (
                          <div className="rounded-lg bg-gray-50 px-2 py-1.5 text-xs">
                            <p className="font-medium">{entry.subject.name}</p>
                            <p className="text-gray-400">{entry.staff.user.name}</p>
                            <button onClick={() => deleteEntry(entry.id)} className="text-red-400 hover:text-red-600 mt-1">
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Period">
        <form onSubmit={addEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Day</label>
              <select className="input" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Period</label>
              <input type="number" min={1} className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Subject</label>
            <select required className="input" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Teacher</label>
            <select required className="input" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
              <option value="">Select teacher</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.user.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-pill border border-gray-200">Cancel</button>
            <button type="submit" className="btn-pill bg-[#111214] text-white">Add</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
