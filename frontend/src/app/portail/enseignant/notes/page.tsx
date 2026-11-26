"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { teacherNav } from "@/lib/navigation";

type Assignment = { id: string; subject: string; subject_name: string; academic_year: string };
type Student = { id: string; student_number: string; full_name: string };
type Grade = {
  id: string;
  student_name: string;
  subject_name: string;
  score: string;
  max_score: string;
  kind: string;
  label: string;
};

export default function TeacherNotesPage() {
  const { token, ready } = useAuthToken();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState({
    student: "",
    subject: "",
    academic_year: "",
    kind: "cc",
    label: "",
    score: "",
    max_score: "20",
    is_published: true,
  });

  async function load() {
    if (!ready || !token) return;
    const [a, s, g] = await Promise.all([
      apiGet<Page<Assignment>>("/teaching-assignments/?page_size=100", token),
      apiGet<Page<Student>>("/students/?page_size=100", token),
      apiGet<Page<Grade>>("/grades/?page_size=100", token),
    ]);
    const assigns = unwrapList(a);
    setAssignments(assigns);
    setStudents(unwrapList(s));
    setGrades(unwrapList(g));
    if (assigns[0] && !form.subject) {
      setForm((f) => ({
        ...f,
        subject: assigns[0].subject,
        academic_year: assigns[0].academic_year,
      }));
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !token) return;
    setError(null);
    try {
      await apiSend("/grades/", token, "POST", {
        ...form,
        score: form.score,
        max_score: form.max_score,
      });
      setOk("Note enregistrée et notifiée à l'étudiant.");
      setForm((f) => ({ ...f, score: "", label: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Évaluation</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Saisie des notes</h1>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Nouvelle note</h2>
          <select
            required
            value={form.subject}
            onChange={(e) => {
              const a = assignments.find((x) => x.subject === e.target.value);
              setForm({
                ...form,
                subject: e.target.value,
                academic_year: a?.academic_year || form.academic_year,
              });
            }}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="">Matière…</option>
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
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="">Étudiant…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.student_number} — {s.full_name}
              </option>
            ))}
          </select>
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="cc">Contrôle continu</option>
            <option value="exam">Examen</option>
            <option value="tp">TP</option>
            <option value="other">Autre</option>
          </select>
          <input
            placeholder="Libellé (ex. CC1)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="number"
              step="0.01"
              placeholder="Note"
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            />
            <input
              required
              type="number"
              step="0.01"
              placeholder="Sur"
              value={form.max_score}
              onChange={(e) => setForm({ ...form, max_score: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-md bg-iua-navy px-4 py-2.5 text-sm text-white">
            Publier la note
          </button>
        </form>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Notes saisies</h2>
          <ul className="mt-4 max-h-[28rem] divide-y divide-iua-navy/10 overflow-auto text-sm">
            {grades.map((g) => (
              <li key={g.id} className="flex justify-between py-3">
                <div>
                  <p className="font-medium text-iua-navy">{g.student_name}</p>
                  <p className="text-xs text-iua-muted">
                    {g.subject_name} · {g.label || g.kind}
                  </p>
                </div>
                <span className="font-display text-lg">
                  {g.score}/{g.max_score}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
