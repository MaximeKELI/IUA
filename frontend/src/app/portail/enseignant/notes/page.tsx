"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { teacherNav } from "@/lib/navigation";

type Assignment = {
  id: string;
  subject: string;
  subject_name: string;
  academic_year: string;
  program_id?: string;
};

type Student = {
  id: string;
  student_number: string | null;
  full_name: string;
  program: string | null;
};

type Grade = {
  id: string;
  student: string;
  student_name: string;
  student_number?: string | null;
  subject: string;
  subject_name: string;
  score: string;
  max_score: string;
  kind: string;
  label: string;
  is_published: boolean;
  academic_year: string;
};

function TeacherNotesInner() {
  const { token, ready } = useAuthToken();
  const search = useSearchParams();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [filterSubject, setFilterSubject] = useState(search.get("subject") || "");
  const [form, setForm] = useState({
    student: search.get("student") || "",
    subject: search.get("subject") || "",
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
      apiGet<Page<Student>>("/students/?page_size=200", token),
      apiGet<Page<Grade>>("/grades/?page_size=200", token),
    ]);
    const assigns = unwrapList(a);
    setAssignments(assigns);
    setStudents(unwrapList(s));
    setGrades(unwrapList(g));
    setForm((f) => {
      if (f.subject && f.academic_year) return f;
      const preferred =
        assigns.find((x) => x.subject === (f.subject || search.get("subject"))) || assigns[0];
      if (!preferred) return f;
      return {
        ...f,
        subject: f.subject || preferred.subject,
        academic_year: preferred.academic_year,
        student: f.student || search.get("student") || "",
      };
    });
    if (!filterSubject && search.get("subject")) {
      setFilterSubject(search.get("subject") || "");
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  const selectedAssignment = assignments.find((a) => a.subject === form.subject);
  const studentsForSubject = useMemo(() => {
    if (!selectedAssignment?.program_id) return students;
    return students.filter((s) => !s.program || s.program === selectedAssignment.program_id);
  }, [students, selectedAssignment]);

  const visibleGrades = useMemo(() => {
    if (!filterSubject) return grades;
    return grades.filter((g) => g.subject === filterSubject);
  }, [grades, filterSubject]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !token) return;
    setSending(true);
    setError(null);
    setOk(null);
    try {
      await apiSend("/grades/", token, "POST", {
        student: form.student,
        subject: form.subject,
        academic_year: form.academic_year,
        kind: form.kind,
        label: form.label,
        score: form.score,
        max_score: form.max_score,
        is_published: form.is_published,
      });
      setOk(form.is_published ? "Note publiée." : "Brouillon enregistré.");
      setForm((f) => ({ ...f, score: "", label: "" }));
      clearApiMemoryCache();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setSending(false);
    }
  }

  async function togglePublish(g: Grade) {
    if (!token) return;
    setError(null);
    try {
      await apiSend(`/grades/${g.id}/`, token, "PATCH", {
        is_published: !g.is_published,
      });
      clearApiMemoryCache();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  async function removeGrade(id: string) {
    if (!token) return;
    if (!window.confirm("Supprimer cette note ?")) return;
    setError(null);
    try {
      await apiSend(`/grades/${id}/`, token, "DELETE");
      clearApiMemoryCache();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Notes</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Saisie par matière. Vous pouvez enregistrer un brouillon ou publier tout de suite.
      </p>
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {ok && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Nouvelle note</h2>
          <label className="block text-sm">
            <span className="mb-1 block text-iua-muted">Matière</span>
            <select
              required
              value={form.subject}
              onChange={(e) => {
                const a = assignments.find((x) => x.subject === e.target.value);
                setForm({
                  ...form,
                  subject: e.target.value,
                  academic_year: a?.academic_year || form.academic_year,
                  student: "",
                });
                setFilterSubject(e.target.value);
              }}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            >
              <option value="">Choisir…</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.subject}>
                  {a.subject_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-iua-muted">Étudiant</span>
            <select
              required
              value={form.student}
              onChange={(e) => setForm({ ...form, student: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            >
              <option value="">Choisir…</option>
              {studentsForSubject.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.student_number ? `${s.student_number} ` : ""}
                  {s.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-iua-muted">Type</span>
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
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-iua-muted">Libellé</span>
            <input
              placeholder="Ex. CC1, Devoir maison"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-iua-muted">Note</span>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.score}
                onChange={(e) => setForm({ ...form, score: e.target.value })}
                className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-iua-muted">Sur</span>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                value={form.max_score}
                onChange={(e) => setForm({ ...form, max_score: e.target.value })}
                className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-iua-navy">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Publier immédiatement (visible par l’étudiant)
          </label>
          <button
            type="submit"
            disabled={sending || assignments.length === 0}
            className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Enregistrement…" : form.is_published ? "Publier" : "Enregistrer le brouillon"}
          </button>
        </form>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl text-iua-navy">Notes déjà saisies</h2>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="rounded-md border border-iua-navy/15 px-3 py-2 text-xs"
            >
              <option value="">Toutes les matières</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.subject}>
                  {a.subject_name}
                </option>
              ))}
            </select>
          </div>
          <ul className="mt-4 max-h-[32rem] divide-y divide-iua-navy/10 overflow-auto text-sm">
            {visibleGrades.length === 0 && (
              <li className="py-3 text-iua-muted">Aucune note pour ce filtre.</li>
            )}
            {visibleGrades.map((g) => (
              <li key={g.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-iua-navy">{g.student_name}</p>
                    <p className="text-xs text-iua-muted">
                      {g.subject_name} · {g.label || g.kind}
                      {g.student_number ? ` · ${g.student_number}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-iua-muted">
                      {g.is_published ? "Publiée" : "Brouillon"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg text-iua-navy">
                      {g.score}/{g.max_score}
                    </p>
                    <div className="mt-2 flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => void togglePublish(g)}
                        className="text-xs font-semibold text-iua-cyan"
                      >
                        {g.is_published ? "Dépublier" : "Publier"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeGrade(g.id)}
                        className="text-xs text-red-600"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}


export default function TeacherNotesPage() {
  return (
    <Suspense fallback={<PortalShell title="Espace enseignant" nav={teacherNav}><p className="text-sm text-iua-muted">Chargement…</p></PortalShell>}>
      <TeacherNotesInner />
    </Suspense>
  );
}
