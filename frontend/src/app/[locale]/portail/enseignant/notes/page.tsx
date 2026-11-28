"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import {
  ENTRY_STATUS_LABELS,
  appreciationClass,
  appreciationFor,
  buildColumnsFromScheme,
  computeWeightedAverage,
  downloadTextFile,
  gradesToCsv,
  parseGradesCsv,
  type ColumnDef,
  type EntryStatus,
} from "@/lib/grades";
import { teacherNav } from "@/lib/navigation";
import { enqueueOffline, studentsForAssignment, useTeacherAssignments } from "@/lib/teacher";
import { Link } from "@/i18n/navigation";

type Grade = {
  id: string;
  student: string;
  subject: string;
  kind: string;
  label: string;
  sequence?: number;
  score: string | null;
  max_score: string;
  entry_status?: EntryStatus;
  comment?: string;
  is_published: boolean;
  academic_year: string;
};

type CellState = {
  gradeId?: string;
  score: string;
  max: string;
  status: EntryStatus;
  comment: string;
  published: boolean;
  dirty?: boolean;
};

type Scheme = {
  id?: string;
  subject: string;
  interro_weight: string | number;
  devoir_weight: string | number;
  tp_weight: string | number;
  exam_weight: string | number;
  max_score_default: string | number;
  interro_count: number;
  devoir_count: number;
};

function emptyCell(max = "20"): CellState {
  return { score: "", max, status: "scored", comment: "", published: false, dirty: false };
}

function TeacherNotesInner() {
  const search = useSearchParams();
  const { token, ready, assignments, students, error: bootError } = useTeacherAssignments();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [subjectId, setSubjectId] = useState(search.get("subject") || "");
  const [yearId, setYearId] = useState("");
  const [cells, setCells] = useState<Record<string, Record<string, CellState>>>({});
  const [commentsOpen, setCommentsOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const assignment = assignments.find((a) => a.subject === subjectId);
  const columns = useMemo(() => buildColumnsFromScheme(scheme), [scheme]);
  const classRoster = useMemo(() => {
    const list = studentsForAssignment(students, assignment);
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

  const loadGrades = useCallback(async () => {
    if (!ready || !token || !subjectId) return;
    const [g, schemes] = await Promise.all([
      apiGet<Page<Grade>>(`/grades/?subject=${subjectId}&page_size=500`, token),
      apiGet<Page<Scheme>>(`/grade-schemes/?subject=${subjectId}`, token).catch(() => ({ results: [] })),
    ]);
    setGrades(unwrapList(g));
    const sch = unwrapList(schemes)[0] || null;
    setScheme(sch);
  }, [ready, token, subjectId]);

  useEffect(() => {
    if (!subjectId && assignments[0]) {
      setSubjectId(assignments[0].subject);
      setYearId(assignments[0].academic_year);
    } else if (subjectId && !yearId) {
      const a = assignments.find((x) => x.subject === subjectId);
      if (a) setYearId(a.academic_year);
    }
  }, [assignments, subjectId, yearId]);

  useEffect(() => {
    loadGrades().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [loadGrades]);

  useEffect(() => {
    if (!subjectId) {
      setCells({});
      return;
    }
    const cols = buildColumnsFromScheme(scheme);
    const next: Record<string, Record<string, CellState>> = {};
    for (const student of classRoster) {
      const row: Record<string, CellState> = {};
      for (const col of cols) {
        const existing = grades
          .filter(
            (g) =>
              g.student === student.id &&
              g.kind === col.kind &&
              (g.sequence || 1) === col.sequence,
          )
          .sort((a, b) => b.id.localeCompare(a.id))[0];
        row[col.key] = existing
          ? {
              gradeId: existing.id,
              score: existing.score ?? "",
              max: existing.max_score || String(col.max),
              status: (existing.entry_status as EntryStatus) || "scored",
              comment: existing.comment || "",
              published: existing.is_published,
              dirty: false,
            }
          : emptyCell(String(col.max));
      }
      next[student.id] = row;
    }
    setCells(next);
  }, [subjectId, grades, classRoster, scheme]);

  function setCell(studentId: string, key: string, patch: Partial<CellState>) {
    setCells((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [key]: { ...(prev[studentId]?.[key] || emptyCell()), ...patch, dirty: true },
      },
    }));
    setOk(null);
  }

  const stats = useMemo(() => {
    let dirty = 0;
    const averages: number[] = [];
    for (const student of classRoster) {
      const row = cells[student.id] || {};
      const forAvg: Record<string, { score: number; max: number; weight?: number; status?: EntryStatus }> = {};
      for (const col of columns) {
        const cell = row[col.key];
        if (!cell) continue;
        if (cell.dirty) dirty += 1;
        if (cell.status === "scored" && cell.score.trim() !== "") {
          const score = Number(cell.score);
          if (Number.isFinite(score)) {
            forAvg[col.key] = { score, max: Number(cell.max || col.max), weight: col.weight, status: cell.status };
          }
        }
      }
      const avg = computeWeightedAverage(forAvg, columns);
      if (avg !== null) averages.push(avg);
    }
    const classAvg =
      averages.length === 0
        ? null
        : Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 100) / 100;
    return { dirty, classAvg, gradedStudents: averages.length };
  }, [cells, classRoster, columns]);

  async function saveAll(publish: boolean) {
    if (!token || !subjectId || !yearId) return;
    setSending(true);
    setError(null);
    setOk(null);
    let okCount = 0;
    const failures: string[] = [];

    for (const student of classRoster) {
      const row = cells[student.id] || {};
      for (const col of columns) {
        const cell = row[col.key];
        if (!cell) continue;
        const hasScore = cell.score.trim() !== "";
        const isSpecial = cell.status !== "scored";
        if (!hasScore && !isSpecial && !cell.gradeId) continue;
        if (!cell.dirty && cell.gradeId && (!publish || cell.published)) continue;

        const payload = {
          student: student.id,
          subject: subjectId,
          academic_year: yearId,
          kind: col.kind,
          label: col.label,
          sequence: col.sequence,
          score: cell.status === "scored" && hasScore ? cell.score : null,
          max_score: cell.max || String(col.max),
          entry_status: cell.status,
          comment: cell.comment || "",
          is_published: publish || cell.published,
        };

        try {
          if (!navigator.onLine) {
            enqueueOffline({
              method: cell.gradeId ? "PATCH" : "POST",
              path: cell.gradeId ? `/grades/${cell.gradeId}/` : "/grades/",
              payload,
            });
            okCount += 1;
            continue;
          }
          if (cell.gradeId) {
            await apiSend(`/grades/${cell.gradeId}/`, token, "PATCH", {
              score: payload.score,
              max_score: payload.max_score,
              label: payload.label,
              kind: payload.kind,
              sequence: payload.sequence,
              entry_status: payload.entry_status,
              comment: payload.comment,
              is_published: payload.is_published,
            });
          } else {
            await apiSend("/grades/", token, "POST", payload);
          }
          okCount += 1;
        } catch (err) {
          failures.push(`${student.full_name} (${col.short}): ${err instanceof Error ? err.message : "échec"}`);
        }
      }
    }

    clearApiMemoryCache();
    if (navigator.onLine) await loadGrades();
    setOk(
      !navigator.onLine
        ? `${okCount} opération(s) mises en file hors-ligne.`
        : okCount
          ? `${okCount} note(s) enregistrée(s)${publish ? " et publiée(s)" : ""}.`
          : "Aucune modification à enregistrer.",
    );
    if (failures.length) setError(`${failures.length} échec(s) — ${failures[0]}`);
    setSending(false);
  }

  function exportCsv() {
    const rows = classRoster.map((student) => {
      const row = cells[student.id] || {};
      const forAvg: Record<string, { score: number; max: number; weight?: number; status?: EntryStatus }> = {};
      const cellMap: Record<string, string> = {};
      for (const col of columns) {
        const cell = row[col.key];
        if (!cell) {
          cellMap[col.key] = "";
          continue;
        }
        if (cell.status !== "scored") cellMap[col.key] = ENTRY_STATUS_LABELS[cell.status];
        else cellMap[col.key] = cell.score;
        if (cell.status === "scored" && cell.score) {
          forAvg[col.key] = {
            score: Number(cell.score),
            max: Number(cell.max || col.max),
            weight: col.weight,
            status: cell.status,
          };
        }
      }
      const avg = computeWeightedAverage(forAvg, columns);
      return {
        number: student.student_number || "",
        name: student.full_name,
        cells: cellMap,
        average: avg !== null ? String(avg) : "",
        appreciation: appreciationFor(avg).label,
      };
    });
    downloadTextFile(`carnet-${subjectId.slice(0, 8)}.csv`, gradesToCsv(rows, columns), "text/csv;charset=utf-8");
  }

  function exportPdf() {
    const subjectName = assignment?.subject_name || "Matière";
    const win = window.open("", "_blank");
    if (!win) return;
    const rowsHtml = classRoster
      .map((student, i) => {
        const row = cells[student.id] || {};
        const forAvg: Record<string, { score: number; max: number; weight?: number; status?: EntryStatus }> = {};
        const tds = columns
          .map((col) => {
            const cell = row[col.key];
            let v = "—";
            if (cell?.status && cell.status !== "scored") v = ENTRY_STATUS_LABELS[cell.status];
            else if (cell?.score) {
              v = cell.score;
              forAvg[col.key] = {
                score: Number(cell.score),
                max: Number(cell.max || col.max),
                weight: col.weight,
                status: "scored",
              };
            }
            return `<td style="padding:6px;border:1px solid #ccc;text-align:center">${v}</td>`;
          })
          .join("");
        const avg = computeWeightedAverage(forAvg, columns);
        const appr = appreciationFor(avg);
        return `<tr><td style="padding:6px;border:1px solid #ccc">${i + 1}</td><td style="padding:6px;border:1px solid #ccc">${student.student_number || ""}</td><td style="padding:6px;border:1px solid #ccc">${student.full_name}</td>${tds}<td style="padding:6px;border:1px solid #ccc;text-align:center">${avg ?? "—"}</td><td style="padding:6px;border:1px solid #ccc;text-align:center">${appr.label}</td></tr>`;
      })
      .join("");
    win.document.write(`<!doctype html><html><head><title>Carnet ${subjectName}</title></head><body style="font-family:system-ui;padding:24px"><h1>IUA — Carnet de notes</h1><h2>${subjectName}</h2><p>Export ${new Date().toLocaleString("fr-FR")} · GMT</p><table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr><th>#</th><th>Matricule</th><th>Nom</th>${columns.map((c) => `<th>${c.label}</th>`).join("")}<th>Moy.</th><th>Appréciation</th></tr></thead><tbody>${rowsHtml}</tbody></table><script>window.print()</script></body></html>`);
    win.document.close();
  }

  async function onImportFile(file: File) {
    const text = await file.text();
    const parsed = parseGradesCsv(text);
    let applied = 0;
    for (const row of parsed) {
      const student = classRoster.find(
        (s) => (s.student_number || "").toLowerCase() === row.number.toLowerCase(),
      );
      if (!student) continue;
      for (const col of columns) {
        const raw =
          row.scores[col.label.toLowerCase()] ||
          row.scores[col.short.toLowerCase()] ||
          row.scores[col.kind];
        if (raw == null || raw === "") continue;
        const statusKey = Object.entries(ENTRY_STATUS_LABELS).find(
          ([, label]) => label.toLowerCase() === raw.toLowerCase(),
        )?.[0] as EntryStatus | undefined;
        if (statusKey) {
          setCell(student.id, col.key, { status: statusKey, score: "" });
        } else {
          setCell(student.id, col.key, { status: "scored", score: raw.replace(",", ".") });
        }
        applied += 1;
      }
    }
    setOk(`${applied} case(s) importée(s) depuis le CSV — enregistrez pour persister.`);
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-display text-3xl text-iua-navy">Carnet de notes</h1>
          <p className="mt-2 max-w-3xl text-sm text-iua-muted">
            Tableau complet de la classe : colonnes configurables, absences/dispenses, commentaires,
            import/export CSV & PDF, moyenne et appréciation automatiques.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portail/enseignant/baremes"
            className="rounded-md border border-iua-navy/15 bg-white px-3 py-2 text-xs font-semibold text-iua-navy"
          >
            Barèmes
          </Link>
          <button type="button" onClick={exportCsv} className="rounded-md border border-iua-navy/15 bg-white px-3 py-2 text-xs font-semibold text-iua-navy">
            Export CSV
          </button>
          <button type="button" onClick={exportPdf} className="rounded-md border border-iua-navy/15 bg-white px-3 py-2 text-xs font-semibold text-iua-navy">
            Export PDF
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-iua-navy/15 bg-white px-3 py-2 text-xs font-semibold text-iua-navy"
          >
            Import CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={sending || !subjectId}
            onClick={() => void saveAll(false)}
            className="rounded-md border border-iua-navy/15 bg-white px-4 py-2 text-sm font-semibold text-iua-navy disabled:opacity-60"
          >
            Brouillons
          </button>
          <button
            type="button"
            disabled={sending || !subjectId}
            onClick={() => void saveAll(true)}
            className="rounded-md bg-iua-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Enregistrer & publier
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl bg-white p-4 shadow-soft lg:grid-cols-3">
        <label className="block text-sm lg:col-span-2">
          <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-iua-muted">Matière</span>
          <select
            value={subjectId}
            onChange={(e) => {
              const a = assignments.find((x) => x.subject === e.target.value);
              setSubjectId(e.target.value);
              if (a) setYearId(a.academic_year);
            }}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2.5 text-sm"
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
          <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-iua-muted">Recherche</span>
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
          <strong className="text-iua-navy">{roster.length}</strong> <span className="text-iua-muted">étudiants</span>
        </span>
        <span className="rounded-md bg-white px-3 py-2 shadow-soft">
          <strong className="text-iua-navy">{stats.gradedStudents}</strong> <span className="text-iua-muted">moyennes</span>
        </span>
        <span className="rounded-md bg-white px-3 py-2 shadow-soft">
          <strong className="text-iua-navy">{stats.dirty}</strong> <span className="text-iua-muted">modifs</span>
        </span>
        <span className="rounded-md bg-white px-3 py-2 shadow-soft">
          Moy. classe <strong className="text-iua-navy">{stats.classAvg ?? "—"}/20</strong>
        </span>
        {stats.classAvg !== null && (
          <span className={`rounded-md px-3 py-2 font-semibold ${appreciationClass(appreciationFor(stats.classAvg).tone)}`}>
            {appreciationFor(stats.classAvg).label}
          </span>
        )}
      </div>

      {(error || bootError) && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error || bootError}</p>
      )}
      {ok && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>}

      {subjectId && (
        <div className="mt-6 overflow-auto rounded-xl border border-iua-navy/10 bg-white shadow-soft">
          <table className="min-w-[1100px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-iua-navy text-white">
                <th className="px-3 py-3 text-left text-xs uppercase">#</th>
                <th className="px-3 py-3 text-left text-xs uppercase">Matricule</th>
                <th className="min-w-[11rem] px-3 py-3 text-left text-xs uppercase">Étudiant</th>
                {columns.map((col) => (
                  <th key={col.key} className="px-2 py-3 text-center text-xs uppercase">
                    <div>{col.label}</div>
                    <div className="font-normal normal-case opacity-70">/{col.max} · ×{col.weight}</div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs uppercase">Moy.</th>
                <th className="px-3 py-3 text-center text-xs uppercase">Appréciation</th>
                <th className="px-3 py-3 text-center text-xs uppercase">Comm.</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((student, index) => {
                const row = cells[student.id] || {};
                const forAvg: Record<string, { score: number; max: number; weight?: number; status?: EntryStatus }> = {};
                for (const col of columns) {
                  const cell = row[col.key];
                  if (cell?.status === "scored" && cell.score.trim()) {
                    forAvg[col.key] = {
                      score: Number(cell.score),
                      max: Number(cell.max || col.max),
                      weight: col.weight,
                      status: cell.status,
                    };
                  }
                }
                const avg = computeWeightedAverage(forAvg, columns);
                const appr = appreciationFor(avg);
                const commentKey = `${student.id}`;
                return (
                  <tr key={student.id} className="border-t border-iua-navy/10 odd:bg-white even:bg-iua-mist/35">
                    <td className="px-3 py-2 text-xs text-iua-muted">{index + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs text-iua-muted">{student.student_number || "—"}</td>
                    <td className="px-3 py-2 font-medium text-iua-navy">{student.full_name}</td>
                    {columns.map((col) => {
                      const cell = row[col.key] || emptyCell(String(col.max));
                      return (
                        <td key={col.key} className="px-1.5 py-1.5 align-top">
                          <select
                            value={cell.status}
                            onChange={(e) =>
                              setCell(student.id, col.key, {
                                status: e.target.value as EntryStatus,
                                score: e.target.value === "scored" ? cell.score : "",
                              })
                            }
                            className="mb-1 w-full rounded border border-iua-navy/10 bg-white px-1 py-0.5 text-[10px]"
                          >
                            {Object.entries(ENTRY_STATUS_LABELS).map(([k, lab]) => (
                              <option key={k} value={k}>
                                {lab}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            disabled={cell.status !== "scored"}
                            value={cell.score}
                            onChange={(e) => setCell(student.id, col.key, { score: e.target.value, status: "scored" })}
                            className={`w-full rounded-md border px-2 py-1.5 text-center text-sm disabled:bg-iua-mist/60 ${
                              cell.dirty ? "border-iua-sun bg-amber-50" : "border-iua-navy/15"
                            }`}
                            placeholder="—"
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <span className="font-display text-lg text-iua-navy">{avg !== null ? avg.toFixed(2) : "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${appreciationClass(appr.tone)}`}>
                        {appr.code} · {appr.label}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => setCommentsOpen(commentsOpen === commentKey ? null : commentKey)}
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          Object.values(row).some((c) => c.comment)
                            ? "bg-iua-cyan/20 text-iua-navy"
                            : "text-iua-muted hover:bg-iua-mist"
                        }`}
                      >
                        ✎
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {commentsOpen && (
        <div className="mt-4 rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg text-iua-navy">
            Commentaires — {classRoster.find((s) => s.id === commentsOpen)?.full_name}
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {columns.map((col) => {
              const cell = cells[commentsOpen]?.[col.key] || emptyCell();
              return (
                <label key={col.key} className="block text-sm">
                  <span className="mb-1 block text-iua-muted">{col.label}</span>
                  <textarea
                    value={cell.comment}
                    onChange={(e) => setCell(commentsOpen, col.key, { comment: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                    placeholder="Appréciation / remarque…"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}
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
