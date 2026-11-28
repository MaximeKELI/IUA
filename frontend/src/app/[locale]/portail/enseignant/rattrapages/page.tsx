"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { studentsForAssignment, useTeacherAssignments } from "@/lib/teacher";

type CatchUp = {
  id: string;
  subject: string;
  subject_name?: string;
  student: string;
  student_name?: string;
  reason: string;
  preferred_date: string | null;
  status: string;
  teacher_note: string;
  session_label: string;
};

export default function RattrapagesPage() {
  const { token, ready, assignments, students } = useTeacherAssignments();
  const [items, setItems] = useState<CatchUp[]>([]);
  const [form, setForm] = useState({
    subject: "",
    student: "",
    reason: "",
    preferred_date: "",
    session_label: "Session 2",
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const assignment = assignments.find((a) => a.subject === form.subject);
  const roster = studentsForAssignment(students, assignment);

  async function reload() {
    if (!token) return;
    setItems(unwrapList(await apiGet<Page<CatchUp>>("/catchups/?page_size=100", token)));
  }

  useEffect(() => {
    if (ready && token) void reload().catch((e) => setError(String(e.message || e)));
    if (!form.subject && assignments[0]) setForm((f) => ({ ...f, subject: assignments[0].subject }));
  }, [ready, token, assignments]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await apiSend("/catchups/", token, "POST", {
        ...form,
        preferred_date: form.preferred_date || null,
      });
      clearApiMemoryCache();
      setOk("Demande de rattrapage créée.");
      setForm((f) => ({ ...f, reason: "", student: "" }));
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  async function setStatus(id: string, status: string) {
    if (!token) return;
    await apiSend(`/catchups/${id}/`, token, "PATCH", { status });
    clearApiMemoryCache();
    await reload();
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Rattrapages / Session 2</h1>
      <p className="mt-2 text-sm text-iua-muted">Gérez les demandes de seconde chance et leur validation.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <form onSubmit={onSubmit} className="mt-8 grid gap-3 rounded-xl bg-white p-5 shadow-soft md:grid-cols-2">
        <select
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value, student: "" })}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        >
          {assignments.map((a) => (
            <option key={a.id} value={a.subject}>
              {a.subject_name}
            </option>
          ))}
        </select>
        <select
          required
          value={form.student}
          onChange={(e) => setForm({ ...form, student: e.target.value })}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        >
          <option value="">Étudiant…</option>
          {roster.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={form.preferred_date}
          onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <input
          value={form.session_label}
          onChange={(e) => setForm({ ...form, session_label: e.target.value })}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <textarea
          required
          placeholder="Motif"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          rows={3}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm md:col-span-2"
        />
        <button type="submit" className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white md:col-span-2">
          Enregistrer la demande
        </button>
      </form>

      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-iua-navy">{item.student_name}</h2>
                <p className="text-xs text-iua-muted">
                  {item.subject_name} · {item.session_label} · {item.status}
                </p>
                <p className="mt-2 text-sm text-iua-muted">{item.reason}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void setStatus(item.id, "approved")}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Approuver
                </button>
                <button
                  type="button"
                  onClick={() => void setStatus(item.id, "rejected")}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={() => void setStatus(item.id, "done")}
                  className="rounded-md border border-iua-navy/15 px-3 py-1.5 text-xs font-semibold text-iua-navy"
                >
                  Effectué
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
