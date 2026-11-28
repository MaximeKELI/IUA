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

type Mode = "single" | "bulk";

const kindLabels: Record<string, string> = {
  cc: "Contrôle continu",
  exam: "Examen",
  tp: "TP",
  other: "Autre",
};

function TeacherNotesInner() {
  const { token, ready } = useAuthToken();
  const search = useSearchParams();
  const initialMode = search.get("mode") === "bulk" ? "bulk" : "single";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [filterSubject, setFilterSubject] = useState(search.get("subject") || "");
  const [filterStudent, setFilterStudent] = useState(search.get("student") || "");
  const [filterDrafts, setFilterDrafts] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ score: "", max_score: "", label: "" });
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
  const [bulk, setBulk] = useState({
    subject: search.get("subject") || "",
    academic_year: "",
    kind: "cc",
    label: "",
    max_score: "20",
    is_published: false,
  });
  const [bulkScores, setBulkScores] = useState<Record<string, string>>({});

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
    setBulk((b) => {
      if (b.subject && b.academic_year) return b;
      const preferred =
        assigns.find((x) => x.subject === (b.subject || search.get("subject"))) || assigns[0];
      if (!preferred) return b;
      return {
        ...b,
        subject: b.subject || preferred.subject,
        academic_year: preferred.academic_year,
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

  useEffect(() => {
    if (search.get("mode") === "bulk") setMode("bulk");
  }, [search]);

  const selectedAssignment = assignments.find((a) => a.subject === form.subject);
  const bulkAssignment = assignments.find((a) => a.subject === bulk.subject);

  const studentsForSubject = useMemo(() => {
    if (!selectedAssignment?.program_id) return students;
    return students.filter((s) => !s.program || s.program === selectedAssignment.program_id);
  }, [students, selectedAssignment]);

  const studentsForBulk = useMemo(() => {
    if (!bulkAssignment?.program_id) return students;
    return students.filter((s) => !s.program || s.program === bulkAssignment.program_id);
  }, [students, bulkAssignment]);

  const visibleGrades = useMemo(() => {
    return grades.filter((g) => {
      if (filterSubject && g.subject !== filterSubject) return false;
      if (filterStudent && g.student !== filterStudent) return false;
      if (filterDrafts && g.is_published) return false;
      return true;
    });
  }, [grades, filterSubject, filterStudent, filterDrafts]);

  const filledBulkCount = useMemo(
    () => Object.values(bulkScores).filter((v) => v.trim() !== "").length,
    [bulkScores],
  );

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

  async function onBulkSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !token) return;
    const entries = Object.entries(bulkScores).filter(([, score]) => score.trim() !== "");
    if (entries.length === 0) {
      setError("Saisissez au moins une note.");
      return;
    }
    setSending(true);
    setError(null);
    setOk(null);
    let okCount = 0;
    const failures: string[] = [];
    for (const [studentId, score] of entries) {
      try {
        await apiSend("/grades/", token, "POST", {
          student: studentId,
          subject: bulk.subject,
          academic_year: bulk.academic_year,
          kind: bulk.kind,
          label: bulk.label,
          score,
          max_score: bulk.max_score,
          is_published: bulk.is_published,
        });
        okCount += 1;
      } catch (err) {
        const student = students.find((s) => s.id === studentId);
        failures.push(
          `${student?.full_name || studentId}: ${err instanceof Error ? err.message : "échec"}`,
        );
      }
    }
    clearApiMemoryCache();
    await load();
    setBulkScores({});
    if (okCount) {
      setOk(
        bulk.is_published
          ? `${okCount} note${okCount > 1 ? "s" : ""} publiée${okCount > 1 ? "s" : ""}.`
          : `${okCount} brouillon${okCount > 1 ? "s" : ""} enregistré${okCount > 1 ? "s" : ""}.`,
      );
    }
    if (failures.length) {
      setError(`${failures.length} échec${failures.length > 1 ? "s" : ""} — ${failures[0]}`);
    }
    setSending(false);
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
      if (editingId === id) setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  function startEdit(g: Grade) {
    setEditingId(g.id);
    setEditForm({ score: g.score, max_score: g.max_score, label: g.label || "" });
  }

  async function saveEdit(g: Grade) {
    if (!token) return;
    setSending(true);
    setError(null);
    setOk(null);
    try {
      await apiSend(`/grades/${g.id}/`, token, "PATCH", {
        score: editForm.score,
        max_score: editForm.max_score,
        label: editForm.label,
      });
      setOk("Note mise à jour.");
      setEditingId(null);
      clearApiMemoryCache();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setSending(false);
    }
  }

  async function publishAllDrafts() {
    if (!token) return;
    const drafts = visibleGrades.filter((g) => !g.is_published);
    if (drafts.length === 0) return;
    if (!window.confirm(`Publier ${drafts.length} brouillon${drafts.length > 1 ? "s" : ""} ?`)) {
      return;
    }
    setSending(true);
    setError(null);
    setOk(null);
    try {
      for (const g of drafts) {
        await apiSend(`/grades/${g.id}/`, token, "PATCH", { is_published: true });
      }
      clearApiMemoryCache();
      await load();
      setOk(`${drafts.length} note${drafts.length > 1 ? "s" : ""} publiée${drafts.length > 1 ? "s" : ""}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setSending(false);
    }
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Notes</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Saisie individuelle ou collective. Brouillons ou publication immédiate.
      </p>

      <div className="mt-6 inline-flex rounded-lg bg-white p-1 shadow-soft">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            mode === "single" ? "bg-iua-navy text-white" : "text-iua-navy hover:bg-iua-mist"
          }`}
        >
          Individuelle
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            mode === "bulk" ? "bg-iua-navy text-white" : "text-iua-navy hover:bg-iua-mist"
          }`}
        >
          Collective
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {ok && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {mode === "single" ? (
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
                {Object.entries(kindLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
        ) : (
          <form onSubmit={onBulkSubmit} className="space-y-3 rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">Saisie collective</h2>
            <p className="text-xs text-iua-muted">
              Une même évaluation pour toute la promotion. Laissez vide les absents.
            </p>
            <label className="block text-sm">
              <span className="mb-1 block text-iua-muted">Matière</span>
              <select
                required
                value={bulk.subject}
                onChange={(e) => {
                  const a = assignments.find((x) => x.subject === e.target.value);
                  setBulk({
                    ...bulk,
                    subject: e.target.value,
                    academic_year: a?.academic_year || bulk.academic_year,
                  });
                  setFilterSubject(e.target.value);
                  setBulkScores({});
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
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block text-iua-muted">Type</span>
                <select
                  value={bulk.kind}
                  onChange={(e) => setBulk({ ...bulk, kind: e.target.value })}
                  className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                >
                  {Object.entries(kindLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-iua-muted">Sur</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  value={bulk.max_score}
                  onChange={(e) => setBulk({ ...bulk, max_score: e.target.value })}
                  className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-iua-muted">Libellé</span>
              <input
                required
                placeholder="Ex. CC1 — mars 2026"
                value={bulk.label}
                onChange={(e) => setBulk({ ...bulk, label: e.target.value })}
                className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-iua-navy">
              <input
                type="checkbox"
                checked={bulk.is_published}
                onChange={(e) => setBulk({ ...bulk, is_published: e.target.checked })}
              />
              Publier immédiatement
            </label>

            <div className="max-h-[22rem] overflow-auto rounded-md border border-iua-navy/10">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-iua-mist text-xs uppercase tracking-wide text-iua-muted">
                  <tr>
                    <th className="px-3 py-2">Étudiant</th>
                    <th className="w-24 px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-iua-navy/10">
                  {studentsForBulk.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-iua-muted">
                        Aucun étudiant pour cette matière.
                      </td>
                    </tr>
                  )}
                  {studentsForBulk.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-iua-navy">{s.full_name}</p>
                        <p className="text-[11px] text-iua-muted">{s.student_number || "—"}</p>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={bulkScores[s.id] || ""}
                          onChange={(e) =>
                            setBulkScores((prev) => ({ ...prev, [s.id]: e.target.value }))
                          }
                          className="w-full rounded-md border border-iua-navy/15 px-2 py-1.5 text-sm"
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="submit"
              disabled={sending || assignments.length === 0 || filledBulkCount === 0}
              className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {sending
                ? "Enregistrement…"
                : `Enregistrer ${filledBulkCount || ""} note${filledBulkCount > 1 ? "s" : ""}`}
            </button>
          </form>
        )}

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl text-iua-navy">Notes déjà saisies</h2>
            <div className="flex flex-wrap items-center gap-2">
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
              {filterStudent && (
                <button
                  type="button"
                  onClick={() => setFilterStudent("")}
                  className="rounded-md border border-iua-navy/15 px-2.5 py-1.5 text-xs text-iua-navy"
                >
                  Effacer filtre étudiant
                </button>
              )}
              <label className="flex items-center gap-1.5 text-xs text-iua-navy">
                <input
                  type="checkbox"
                  checked={filterDrafts}
                  onChange={(e) => setFilterDrafts(e.target.checked)}
                />
                Brouillons
              </label>
              {visibleGrades.some((g) => !g.is_published) && (
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void publishAllDrafts()}
                  className="rounded-md border border-iua-navy/15 px-2.5 py-1.5 text-xs font-semibold text-iua-navy disabled:opacity-60"
                >
                  Tout publier
                </button>
              )}
            </div>
          </div>
          <ul className="mt-4 max-h-[32rem] divide-y divide-iua-navy/10 overflow-auto text-sm">
            {visibleGrades.length === 0 && (
              <li className="py-3 text-iua-muted">Aucune note pour ce filtre.</li>
            )}
            {visibleGrades.map((g) => (
              <li key={g.id} className="py-3">
                {editingId === g.id ? (
                  <div className="space-y-2">
                    <p className="font-medium text-iua-navy">{g.student_name}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={editForm.label}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        placeholder="Libellé"
                        className="rounded-md border border-iua-navy/15 px-2 py-1.5 text-xs"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.score}
                        onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                        className="rounded-md border border-iua-navy/15 px-2 py-1.5 text-xs"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.max_score}
                        onChange={(e) => setEditForm({ ...editForm, max_score: e.target.value })}
                        className="rounded-md border border-iua-navy/15 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => void saveEdit(g)}
                        className="text-xs font-semibold text-iua-cyan disabled:opacity-60"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-xs text-iua-muted"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-iua-navy">{g.student_name}</p>
                      <p className="text-xs text-iua-muted">
                        {g.subject_name} · {g.label || kindLabels[g.kind] || g.kind}
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
                          onClick={() => startEdit(g)}
                          className="text-xs font-semibold text-iua-navy"
                        >
                          Modifier
                        </button>
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
                )}
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
    <Suspense
      fallback={
        <PortalShell title="Espace enseignant" nav={teacherNav}>
          <p className="text-sm text-iua-muted">Chargement…</p>
        </PortalShell>
      }
    >
      <TeacherNotesInner />
    </Suspense>
  );
}
