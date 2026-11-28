"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import {
  GRADE_COLUMNS,
  appreciationClass,
  appreciationFor,
  computeWeightedAverage,
  kindLabels,
  type GradeKind,
} from "@/lib/grades";
import { teacherNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

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

type CellState = {
  gradeId?: string;
  score: string;
  max: string;
  published: boolean;
  dirty?: boolean;
};

type RowCells = Partial<Record<GradeKind, CellState>>;

function emptyCell(max = "20"): CellState {
  return { score: "", max, published: false, dirty: false };
}

function TeacherNotesInner() {
  const { token, ready } = useAuthToken();
  const search = useSearchParams();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjectId, setSubjectId] = useState(search.get("subject") || "");
  const [yearId, setYearId] = useState("");
  const [cells, setCells] = useState<Record<string, RowCells>>({});
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const load = useCallback(async () => {
    if (!ready || !token) return;
    const [a, s, g] = await Promise.all([
      apiGet<Page<Assignment>>("/teaching-assignments/?page_size=100", token),
      apiGet<Page<Student>>("/students/?page_size=500", token),
      apiGet<Page<Grade>>("/grades/?page_size=500", token),
    ]);
    const assigns = unwrapList(a);
    setAssignments(assigns);
    setStudents(unwrapList(s));
    setGrades(unwrapList(g));

    const fromUrl = search.get("subject") || "";
    setSubjectId((prev) => {
      if (prev) return prev;
      const preferred = assigns.find((x) => x.subject === fromUrl) || assigns[0];
      return preferred?.subject || "";
    });
    setYearId((prev) => {
      if (prev) return prev;
      const preferred = assigns.find((x) => x.subject === fromUrl) || assigns[0];
      return preferred?.academic_year || "";
    });
  }, [ready, token, search]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [load]);

  const assignment = assignments.find((a) => a.subject === subjectId);

  const classRoster = useMemo(() => {
    const list = assignment?.program_id
      ? students.filter((s) => !s.program || s.program === assignment.program_id)
      : students;
    return [...list].sort((a, b) => a.full_name.localeCompare(b.full_name, "fr"));
  }, [students, assignment]);

  const roster = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classRoster;
    return classRoster.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.student_number || "").toLowerCase().includes(q),
    );
  }, [classRoster, query]);

  // Rebuild editable grid when subject / grades / full class roster change
  useEffect(() => {
    if (!subjectId) {
      setCells({});
      return;
    }
    const next: Record<string, RowCells> = {};
    for (const student of classRoster) {
      const row: RowCells = {};
      for (const col of GRADE_COLUMNS) {
        const existing = grades
          .filter(
            (g) =>
              g.subject === subjectId &&
              g.student === student.id &&
              (g.kind === col.kind ||
                g.label.toLowerCase() === col.label.toLowerCase() ||
                g.label.toLowerCase() === col.short.toLowerCase()),
          )
          .sort((a, b) => b.id.localeCompare(a.id))[0];
        row[col.kind] = existing
          ? {
              gradeId: existing.id,
              score: existing.score,
              max: existing.max_score || String(col.max),
              published: existing.is_published,
              dirty: false,
            }
          : emptyCell(String(col.max));
      }
      next[student.id] = row;
    }
    setCells(next);
  }, [subjectId, grades, classRoster]);

  function setCell(studentId: string, kind: GradeKind, patch: Partial<CellState>) {
    setCells((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [kind]: {
          ...(prev[studentId]?.[kind] || emptyCell()),
          ...patch,
          dirty: true,
        },
      },
    }));
    setOk(null);
  }

  const stats = useMemo(() => {
    let filled = 0;
    let dirty = 0;
    const averages: number[] = [];
    for (const student of classRoster) {
      const row = cells[student.id] || {};
      const forAvg: Partial<Record<GradeKind, { score: number; max: number }>> = {};
      for (const col of GRADE_COLUMNS) {
        const cell = row[col.kind];
        if (!cell) continue;
        if (cell.dirty) dirty += 1;
        if (cell.score.trim() !== "") {
          filled += 1;
          const score = Number(cell.score);
          const max = Number(cell.max || col.max);
          if (Number.isFinite(score)) forAvg[col.kind] = { score, max };
        }
      }
      const avg = computeWeightedAverage(forAvg);
      if (avg !== null) averages.push(avg);
    }
    const classAvg =
      averages.length === 0
        ? null
        : Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 100) / 100;
    return { filled, dirty, classAvg, gradedStudents: averages.length };
  }, [cells, classRoster]);

  async function saveAll(publish: boolean) {
    if (!token || !subjectId || !yearId) return;
    setSending(true);
    setError(null);
    setOk(null);
    let okCount = 0;
    const failures: string[] = [];

    for (const student of classRoster) {
      const row = cells[student.id] || {};
      for (const col of GRADE_COLUMNS) {
        const cell = row[col.kind];
        if (!cell) continue;
        const score = cell.score.trim();
        if (score === "") continue;
        if (!cell.dirty && cell.gradeId && cell.published === publish) continue;
        // Always persist dirty cells; also force publish flip when requested
        if (!cell.dirty && cell.gradeId && publish === cell.published) continue;

        const payload = {
          student: student.id,
          subject: subjectId,
          academic_year: yearId,
          kind: col.kind,
          label: col.label,
          score,
          max_score: cell.max || String(col.max),
          is_published: publish || cell.published,
        };

        try {
          if (cell.gradeId) {
            await apiSend(`/grades/${cell.gradeId}/`, token, "PATCH", {
              score: payload.score,
              max_score: payload.max_score,
              label: payload.label,
              kind: payload.kind,
              is_published: payload.is_published,
            });
          } else {
            await apiSend("/grades/", token, "POST", payload);
          }
          okCount += 1;
        } catch (err) {
          failures.push(
            `${student.full_name} (${col.short}): ${err instanceof Error ? err.message : "échec"}`,
          );
        }
      }
    }

    clearApiMemoryCache();
    await load();
    if (okCount) {
      setOk(
        publish
          ? `${okCount} note${okCount > 1 ? "s" : ""} enregistrée${okCount > 1 ? "s" : ""} et publiée${okCount > 1 ? "s" : ""}.`
          : `${okCount} note${okCount > 1 ? "s" : ""} enregistrée${okCount > 1 ? "s" : ""} (brouillon).`,
      );
    } else if (!failures.length) {
      setOk("Aucune modification à enregistrer.");
    }
    if (failures.length) {
      setError(`${failures.length} échec(s) — ${failures[0]}`);
    }
    setSending(false);
  }

  async function clearCell(studentId: string, kind: GradeKind) {
    const cell = cells[studentId]?.[kind];
    if (!cell) return;
    if (cell.gradeId && token) {
      if (!window.confirm("Supprimer cette note ?")) return;
      try {
        await apiSend(`/grades/${cell.gradeId}/`, token, "DELETE");
        clearApiMemoryCache();
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec suppression");
      }
      return;
    }
    setCell(studentId, kind, { score: "", dirty: false, gradeId: undefined });
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl text-iua-navy">Carnet de notes</h1>
          <p className="mt-2 max-w-2xl text-sm text-iua-muted">
            Tableau de la classe : interro, devoir, TP et examen. La moyenne et l’appréciation se
            calculent automatiquement (pondération examen ×2, devoir ×1,5).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={sending || !subjectId}
            onClick={() => void saveAll(false)}
            className="rounded-md border border-iua-navy/15 bg-white px-4 py-2.5 text-sm font-semibold text-iua-navy disabled:opacity-60"
          >
            {sending ? "Enregistrement…" : "Enregistrer brouillons"}
          </button>
          <button
            type="button"
            disabled={sending || !subjectId}
            onClick={() => void saveAll(true)}
            className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Enregistrer & publier
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-iua-muted">
            Matière
          </span>
          <select
            value={subjectId}
            onChange={(e) => {
              const a = assignments.find((x) => x.subject === e.target.value);
              setSubjectId(e.target.value);
              if (a) setYearId(a.academic_year);
              setOk(null);
            }}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2.5 text-sm"
          >
            <option value="">Choisir une matière…</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.subject}>
                {a.subject_name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-iua-muted">
            Rechercher un étudiant
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom ou matricule…"
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-md bg-white px-3 py-2 shadow-soft">
          <strong className="text-iua-navy">{roster.length}</strong>{" "}
          <span className="text-iua-muted">étudiants</span>
        </span>
        <span className="rounded-md bg-white px-3 py-2 shadow-soft">
          <strong className="text-iua-navy">{stats.gradedStudents}</strong>{" "}
          <span className="text-iua-muted">avec moyenne</span>
        </span>
        <span className="rounded-md bg-white px-3 py-2 shadow-soft">
          <strong className="text-iua-navy">{stats.dirty}</strong>{" "}
          <span className="text-iua-muted">cases modifiées</span>
        </span>
        <span className="rounded-md bg-white px-3 py-2 shadow-soft">
          <span className="text-iua-muted">Moyenne classe </span>
          <strong className="text-iua-navy">
            {stats.classAvg !== null ? `${stats.classAvg}/20` : "—"}
          </strong>
        </span>
        {stats.classAvg !== null && (
          <span
            className={`rounded-md px-3 py-2 text-sm font-semibold ${appreciationClass(
              appreciationFor(stats.classAvg).tone,
            )}`}
          >
            {appreciationFor(stats.classAvg).label}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {ok && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>
      )}

      {!subjectId ? (
        <p className="mt-8 text-sm text-iua-muted">Sélectionnez une matière pour ouvrir le carnet.</p>
      ) : (
        <div className="mt-6 overflow-auto rounded-xl border border-iua-navy/10 bg-white shadow-soft">
          <table className="min-w-[960px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-iua-navy text-left text-white">
                <th className="sticky start-0 z-10 bg-iua-navy px-3 py-3 text-xs font-semibold uppercase tracking-wide">
                  #
                </th>
                <th className="sticky start-10 z-10 bg-iua-navy px-3 py-3 text-xs font-semibold uppercase tracking-wide">
                  Matricule
                </th>
                <th className="sticky start-[7.5rem] z-10 min-w-[12rem] bg-iua-navy px-3 py-3 text-xs font-semibold uppercase tracking-wide">
                  Étudiant
                </th>
                {GRADE_COLUMNS.map((col) => (
                  <th key={col.kind} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                    <div>{col.label}</div>
                    <div className="mt-0.5 font-normal normal-case opacity-70">
                      /{col.max} · ×{col.weight}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                  Moyenne
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                  Appréciation
                </th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 && (
                <tr>
                  <td colSpan={3 + GRADE_COLUMNS.length + 2} className="px-4 py-8 text-center text-iua-muted">
                    Aucun étudiant pour cette matière.
                  </td>
                </tr>
              )}
              {roster.map((student, index) => {
                const row = cells[student.id] || {};
                const forAvg: Partial<Record<GradeKind, { score: number; max: number }>> = {};
                for (const col of GRADE_COLUMNS) {
                  const cell = row[col.kind];
                  if (!cell?.score.trim()) continue;
                  const score = Number(cell.score);
                  const max = Number(cell.max || col.max);
                  if (Number.isFinite(score)) forAvg[col.kind] = { score, max };
                }
                const avg = computeWeightedAverage(forAvg);
                const appr = appreciationFor(avg);

                return (
                  <tr
                    key={student.id}
                    className="border-t border-iua-navy/10 odd:bg-white even:bg-iua-mist/40 hover:bg-iua-cyan/5"
                  >
                    <td className="sticky start-0 bg-inherit px-3 py-2 text-xs text-iua-muted">
                      {index + 1}
                    </td>
                    <td className="sticky start-10 bg-inherit px-3 py-2 font-mono text-xs text-iua-muted">
                      {student.student_number || "—"}
                    </td>
                    <td className="sticky start-[7.5rem] bg-inherit px-3 py-2 font-medium text-iua-navy">
                      {student.full_name}
                    </td>
                    {GRADE_COLUMNS.map((col) => {
                      const cell = row[col.kind] || emptyCell(String(col.max));
                      return (
                        <td key={col.kind} className="px-2 py-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max={Number(cell.max || col.max)}
                              value={cell.score}
                              onChange={(e) =>
                                setCell(student.id, col.kind, { score: e.target.value })
                              }
                              placeholder="—"
                              className={`w-16 rounded-md border px-2 py-1.5 text-center text-sm ${
                                cell.dirty
                                  ? "border-iua-sun bg-amber-50"
                                  : cell.gradeId
                                    ? "border-iua-navy/20 bg-white"
                                    : "border-iua-navy/10 bg-white"
                              }`}
                              aria-label={`${col.label} — ${student.full_name}`}
                            />
                            {cell.gradeId && (
                              <button
                                type="button"
                                title="Supprimer"
                                onClick={() => void clearCell(student.id, col.kind)}
                                className="text-[10px] text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          {cell.gradeId && (
                            <p className="mt-0.5 text-center text-[10px] uppercase tracking-wide text-iua-muted">
                              {cell.published ? "publié" : "brouillon"}
                              {cell.dirty ? " · modif." : ""}
                            </p>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <span className="font-display text-lg text-iua-navy">
                        {avg !== null ? avg.toFixed(2) : "—"}
                      </span>
                      <span className="text-xs text-iua-muted">/20</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${appreciationClass(
                          appr.tone,
                        )}`}
                      >
                        {appr.code} · {appr.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <details className="mt-8 rounded-xl bg-white p-5 shadow-soft">
        <summary className="cursor-pointer font-display text-lg text-iua-navy">
          Légende & pondération
        </summary>
        <ul className="mt-4 grid gap-2 text-sm text-iua-muted sm:grid-cols-2">
          {GRADE_COLUMNS.map((col) => (
            <li key={col.kind}>
              <strong className="text-iua-navy">{col.label}</strong> ({kindLabels[col.kind]}) —
              coefficient {col.weight}
            </li>
          ))}
          <li className="sm:col-span-2">
            Appréciations : ≥16 Excellent · ≥14 Très bien · ≥12 Bien · ≥10 Assez bien · ≥8 Passable ·
            &lt;8 Insuffisant
          </li>
          <li className="sm:col-span-2">
            Astuce : saisissez toute la colonne, puis « Enregistrer & publier » pour rendre les notes
            visibles aux étudiants.
          </li>
        </ul>
      </details>
    </PortalShell>
  );
}

export default function TeacherNotesPage() {
  return (
    <Suspense
      fallback={
        <PortalShell title="Espace enseignant" nav={teacherNav}>
          <p className="text-sm text-iua-muted">Chargement du carnet…</p>
        </PortalShell>
      }
    >
      <TeacherNotesInner />
    </Suspense>
  );
}
