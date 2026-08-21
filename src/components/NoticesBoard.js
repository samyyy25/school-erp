"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

const AUDIENCE_LABEL = { ALL: "Everyone", STAFF: "Staff only", STUDENT: "Students only" };

export default function NoticesBoard({ initialNotices, canPost, currentUserId }) {
  const router = useRouter();
  const [notices, setNotices] = useState(initialNotices);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", audience: "ALL" });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const data = await fetch("/api/notices").then((r) => r.json());
    setNotices(data);
    router.refresh();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      setForm({ title: "", content: "", audience: "ALL" });
      refresh();
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this notice?")) return;
    await fetch("/api/notices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  return (
    <div>
      {canPost && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setOpen(true)} className="btn-pill bg-[#111214] text-white">
            + Post Notice
          </button>
        </div>
      )}

      <div className="space-y-4">
        {notices.map((n) => (
          <div key={n.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {n.postedBy.name} · {new Date(n.createdAt).toLocaleString()} · {AUDIENCE_LABEL[n.audience]}
                </p>
              </div>
              {canPost && (
                <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 hover:text-red-600 whitespace-nowrap">
                  Delete
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-3">{n.content}</p>
          </div>
        ))}
        {notices.length === 0 && <p className="text-sm text-gray-400">No notices to show yet.</p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Post Notice">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea required rows={4} className="input" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div>
            <label className="label">Audience</label>
            <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="ALL">Everyone</option>
              <option value="STAFF">Staff only</option>
              <option value="STUDENT">Students only</option>
            </select>
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
