"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiGetCached, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { studentNav } from "@/lib/navigation";

type Grade = {
  id: string;
  subject: string;
  subject_name: string;
  subject_code: string;
  kind: string;
  label: string;
  score: string;
  max_score: string;
  created_at: string;
};

type Dashboard = {
  avg_score?: number | null;
  grades_count?: number;
};

const kindLabels: Record<string, string> = {
  cc: "Contrôle continu",
  exam: "Examen",
  tp: "Travaux pratiques",
  other: "Autre",
};

function toPct(score: string, max: string) {
  const m = Number(max);
  if (!m) return 0;
  return Math.min(100, (Number(score) / m) * 100);
}

function toOver20(score: string, max: string) {
  const m = Number(max);
  if (!m) return null;
  return Math.round((Number(score) / m) * 20 * 100) / 100;
}

export default function StudentNotesPage() {
  const { token, ready } = useAuthToken();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [avgGlobal, setAvgGlobal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterKind, setFilterKind] = useState("");
  const [view, setView] = useState<"list" | "by-subject">("by-subject");

  useEffect(() => {
    if (!ready || !token) return;
    Promise.all([
      apiGet<Page<Grade>>("/grades/?page_size=200", token),
      apiGetCached<Dashboard>("/portal/student/dashboard/", token, 12_000),
    ])
      .then(([g, d]) => {
        setGrades(unwrapList(g));
        setAvgGlobal(d.avg_score ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  const subjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string }>();
    for (const g of grades) {
      if (!map.has(g.subject)) {
        map.set(g.subject, {
          id: g.subject,
          name: g.subject_name,
          code: g.subject_code,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [grades]);

  const filtered = useMemo(() => {
    return grades.filter((g) => {
      if (filterSubject && g.subject !== filterSubject) return false;
      if (filterKind && g.kind !== filterKind) return false;
      return true;
    });
  }, [grades, filterSubject, filterKind]);

  const bySubject = useMemo(() => {
    const groups = new Map<
      string,
      {
        id: string;
        name: string;
        code: string;
        grades: Grade[];
        avg: number | null;
      }
    >();
    for (const g of filtered) {
      let bucket = groups.get(g.subject);
      if (!bucket) {
        bucket = {
          id: g.subject,
          name: g.subject_name,
          code: g.subject_code,
          grades: [],
          avg: null,
        };
        groups.set(g.subject, bucket);
      }
      bucket.grades.push(g);
    }
    for (const bucket of groups.values()) {
      const ratios = bucket.grades
        .map((g) => toOver20(g.score, g.max_score))
        .filter((n): n is number => n != null);
      bucket.avg =
        ratios.length > 0
          ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) / 100
          : null;
      bucket.grades.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [filtered]);

  const filterAvg = useMemo(() => {
    const ratios = filtered
      .map((g) => toOver20(g.score, g.max_score))
      .filter((n): n is number => n != null);
    if (!ratios.length) return null;
    return Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) / 100;
  }, [filtered]);

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Résultats</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Notes & résultats</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Notes publiées par vos enseignants. Moyenne calculée sur 20.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">Moyenne générale</p>
          <p className="mt-2 font-display text-3xl text-iua-navy">
            {avgGlobal != null ? `${avgGlobal}/20` : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">Notes visibles</p>
          <p className="mt-2 font-display text-3xl text-iua-navy">{filtered.length}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">
            {filterSubject || filterKind ? "Moyenne filtrée" : "Matières notées"}
          </p>
          <p className="mt-2 font-display text-3xl text-iua-navy">
            {filterSubject || filterKind
              ? filterAvg != null
                ? `${filterAvg}/20`
                : "—"
              : String(subjects.length)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg bg-white p-1 shadow-soft">
          <button
            type="button"
            onClick={() => setView("by-subject")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              view === "by-subject" ? "bg-iua-navy text-white" : "text-iua-navy"
            }`}
          >
            Par matière
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              view === "list" ? "bg-iua-navy text-white" : "text-iua-navy"
            }`}
          >
            Liste
          </button>
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-md border border-iua-navy/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">Toutes les matières</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value)}
          className="rounded-md border border-iua-navy/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">Tous les types</option>
          {Object.entries(kindLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {view === "list" ? (
        <div className="mt-6 overflow-auto rounded-xl bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-iua-mist text-xs uppercase tracking-wide text-iua-muted">
              <tr>
                <th className="px-4 py-3">Matière</th>
                <th className="px-4 py-3">Évaluation</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">/20</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-iua-navy/10">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-iua-muted">
                    Aucune note publiée pour ce filtre.
                  </td>
                </tr>
              )}
              {filtered.map((g) => {
                const over20 = toOver20(g.score, g.max_score);
                return (
                  <tr key={g.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-iua-navy">{g.subject_name}</p>
                      <p className="text-xs text-iua-muted">{g.subject_code}</p>
                    </td>
                    <td className="px-4 py-3 text-iua-muted">
                      <p>{g.label || kindLabels[g.kind] || g.kind}</p>
                      <p className="text-[11px]">{kindLabels[g.kind] || g.kind}</p>
                    </td>
                    <td className="px-4 py-3 text-iua-muted">
                      {g.created_at
                        ? new Date(g.created_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-display text-lg text-iua-navy">
                      {g.score}/{g.max_score}
                    </td>
                    <td className="px-4 py-3 text-iua-muted">
                      {over20 != null ? over20 : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bySubject.length === 0 && (
            <p className="rounded-xl bg-white p-5 text-sm text-iua-muted shadow-soft">
              Aucune note publiée pour le moment.
            </p>
          )}
          {bySubject.map((group) => (
            <section key={group.id} className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">
                    {group.code}
                  </p>
                  <h2 className="mt-1 font-display text-xl text-iua-navy">{group.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">Moyenne</p>
                  <p className="font-display text-2xl text-iua-navy">
                    {group.avg != null ? `${group.avg}/20` : "—"}
                  </p>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
                {group.grades.map((g) => {
                  const pct = toPct(g.score, g.max_score);
                  return (
                    <li key={g.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-iua-navy">
                            {g.label || kindLabels[g.kind] || g.kind}
                          </p>
                          <p className="text-xs text-iua-muted">
                            {kindLabels[g.kind] || g.kind}
                            {g.created_at
                              ? ` · ${new Date(g.created_at).toLocaleDateString("fr-FR")}`
                              : ""}
                          </p>
                        </div>
                        <span className="font-display text-lg text-iua-navy">
                          {g.score}/{g.max_score}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-iua-mist">
                        <div
                          className="h-full rounded-full bg-iua-cyan/80"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
