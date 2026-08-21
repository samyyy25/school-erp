"use client";

import { useState } from "react";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";

const EMPTY_EXAM = { name: "", classId: "", subjectId: "", examDate: new Date().toISOString().slice(0, 10), maxMarks: 100 };

export default function StaffMarksClient({ subjects, initialExams }) {
  const [exams, setExams] = useState(initialExams);
  const [examModal, setExamModal] = useState(false);
  const [examForm, setExamForm] = useState({ ...EMPTY_EXAM, subjectId: subjects[0]?.id || "", classId: subjects[0]?.classId || "" });
  const [error, setError] = useState("");

  const [marksModal, setMarksModal] = useState(false);
  const [marksData, setMarksData] = useState(null);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  async function refreshExams() {
    const subjectIds = subjects.map((s) => s.id);
    const data = await fetch("/api/exams").then((r) => r.json());
    setExams(data.filter((e) => subjectIds.includes(e.subjectId)));
  }

  async function createExam(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(examForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.message || "Failed to create exam");
      return;
    }
    setExamModal(false);
    refreshExams();
  }

  async function openMarks(exam) {
    setMarksModal(true);
    setLoadingMarks(true);
    const data = await fetch(`/api/marks?examId=${exam.id}`).then((r) => r.json());
    setMarksData(data);
    setLoadingMarks(false);
  }

  function updateMark(studentId, value) {
    setMarksData((d) => ({
      ...d,
      rows: d.rows.map((r) => (r.studentId === studentId ? { ...r, marksObtained: value } : r)),
    }));
  }

  async function saveMarks() {
    setSavingMarks(true);
    const entries = marksData.rows.map((r) => ({ studentId: r.studentId, marksObtained: r.marksObtained }));
    await fetch("/api/marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examId: marksData.exam.id, entries }),
    });
    setSavingMarks(false);
    setMarksModal(false);
    refreshExams();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setExamModal(true)} className="btn-pill bg-[#111214] text-white">
          + Create Exam
        </button>
      </div>

      <DataTable
        rows={exams}
        searchKeys={["name"]}
        columns={[
          { key: "name", header: "Exam" },
          { key: "class", header: "Class", render: (r) => r.class.name },
          { key: "subject", header: "Subject", render: (r) => r.subject.name },
          { key: "examDate", header: "Date", render: (r) => new Date(r.examDate).toLocaleDateString() },
          { key: "count", header: "Marks Entered", render: (r) => r._count.marks },
        ]}
        actions={(row) => (
          <button onClick={() => openMarks(row)} className="text-xs text-gray-500 hover:text-gray-900">
            Enter Marks
          </button>
        )}
      />

      <Modal open={examModal} onClose={() => setExamModal(false)} title="Create Exam">
        <form onSubmit={createExam} className="space-y-4">
          <div>
            <label className="label">Exam Name</label>
            <input required className="input" placeholder="e.g. Unit Test 1" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Subject</label>
            <select required className="input" value={examForm.subjectId} onChange={(e) => {
              const subj = subjects.find((s) => s.id === e.target.value);
              setExamForm({ ...examForm, subjectId: e.target.value, classId: subj?.classId || "" });
            }}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.class.name})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Exam Date</label>
              <input required type="date" className="input" value={examForm.examDate} onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Max Marks</label>
              <input required type="number" className="input" value={examForm.maxMarks} onChange={(e) => setExamForm({ ...examForm, maxMarks: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setExamModal(false)} className="btn-pill border border-gray-200">Cancel</button>
            <button type="submit" className="btn-pill bg-[#111214] text-white">Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={marksModal} onClose={() => setMarksModal(false)} title={marksData ? `Marks — ${marksData.exam.name}` : "Marks"} wide>
        {loadingMarks || !marksData ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : (
          <div>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No.</th>
                  <th>Marks (out of {marksData.exam.maxMarks})</th>
                </tr>
              </thead>
              <tbody>
                {marksData.rows.map((r) => (
                  <tr key={r.studentId}>
                    <td>{r.name}</td>
                    <td>{r.admissionNo}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={marksData.exam.maxMarks}
                        className="input w-28"
                        value={r.marksObtained ?? ""}
                        onChange={(e) => updateMark(r.studentId, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setMarksModal(false)} className="btn-pill border border-gray-200">Cancel</button>
              <button onClick={saveMarks} disabled={savingMarks} className="btn-pill bg-[#111214] text-white disabled:opacity-60">
                {savingMarks ? "Saving..." : "Save Marks"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
