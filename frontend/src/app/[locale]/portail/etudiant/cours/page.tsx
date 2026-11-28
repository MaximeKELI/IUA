"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiGetCached, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { studentNav } from "@/lib/navigation";

type Dashboard = {
  profile: {
    program: string | null;
    program_code?: string | null;
    cohort: string | null;
    student_number: string | null;
    level?: string | null;
  };
  enrollments_count: number;
  enrollments?: {
    id: string;
    status: string;
    program: string;
    program_code: string;
    cohort: string;
    academic_year: string;
    enrolled_at?: string | null;
  }[];
  subjects?: SubjectCard[];
};

type SubjectCard = {
  id: string;
  name: string;
  code: string;
  hours: number;
  coefficient: string;
  semester: number;
  ue_code: string;
  ue_name: string;
  credits: string;
  teacher?: string | null;
  grades_count: number;
  avg_score?: number | null;
  latest_grade?: string | null;
  latest_label?: string | null;
};

type Enrollment = {
  id: string;
  status: string;
  program_name?: string;
  cohort_name?: string;
  academic_year_name?: string;
};

const enrollmentStatus: Record<string, string> = {
  active: "Active",
  suspended: "Suspendue",
  completed: "Terminée",
  withdrawn: "Annulée",
};

export default function StudentCoursPage() {
  const locale = useLocale();
  const { token, ready } = useAuthToken();
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [semester, setSemester] = useState<string>("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!ready || !token) return;
    Promise.all([
      apiGetCached<Dashboard>("/portal/student/dashboard/", token, 12_000),
      apiGet<Page<Enrollment>>("/enrollments/?page_size=50", token),
    ])
      .then(([d, e]) => {
        setDash(d);
        setEnrollments(unwrapList(e));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  const subjects = dash?.subjects || [];

  const semesters = useMemo(() => {
    return Array.from(new Set(subjects.map((s) => s.semester))).sort((a, b) => a - b);
  }, [subjects]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return subjects.filter((s) => {
      if (semester && String(s.semester) !== semester) return false;
      if (!needle) return true;
      return (
        s.name.toLowerCase().includes(needle) ||
        s.code.toLowerCase().includes(needle) ||
        s.ue_name.toLowerCase().includes(needle) ||
        (s.teacher || "").toLowerCase().includes(needle)
      );
    });
  }, [subjects, semester, q]);

  const byUe = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string; credits: string; semester: number; subjects: SubjectCard[] }
    >();
    for (const s of filtered) {
      const key = `${s.semester}-${s.ue_code}`;
      let ue = map.get(key);
      if (!ue) {
        ue = {
          code: s.ue_code,
          name: s.ue_name,
          credits: s.credits,
          semester: s.semester,
          subjects: [],
        };
        map.set(key, ue);
      }
      ue.subjects.push(s);
    }
    return Array.from(map.values()).sort(
      (a, b) => a.semester - b.semester || a.code.localeCompare(b.code, locale),
    );
  }, [filtered]);

  const totals = useMemo(() => {
    const hours = filtered.reduce((n, s) => n + (s.hours || 0), 0);
    const graded = filtered.filter((s) => s.grades_count > 0).length;
    return { hours, graded, total: filtered.length };
  }, [filtered]);

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Parcours</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Cours & matières</h1>
      {dash && (
        <p className="mt-2 text-sm text-iua-muted">
          {dash.profile.program_code
            ? `${dash.profile.program_code} — ${dash.profile.program}`
            : dash.profile.program || "Formation non affectée"}
          {dash.profile.cohort ? ` · ${dash.profile.cohort}` : ""}
          {dash.profile.level ? ` · ${dash.profile.level}` : ""}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">Matières</p>
          <p className="mt-2 font-display text-3xl text-iua-navy">{totals.total}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">Volume horaire</p>
          <p className="mt-2 font-display text-3xl text-iua-navy">{totals.hours} h</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">Matières notées</p>
          <p className="mt-2 font-display text-3xl text-iua-navy">
            {totals.graded}/{totals.total}
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-xl bg-white p-5 shadow-soft">
        <h2 className="font-display text-xl text-iua-navy">Inscriptions</h2>
        <ul className="mt-3 divide-y divide-iua-navy/10 text-sm">
          {(dash?.enrollments?.length || enrollments.length) === 0 && (
            <li className="py-3 text-iua-muted">Pas encore inscrit.</li>
          )}
          {dash?.enrollments?.length
            ? dash.enrollments.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-iua-navy">
                      {e.program_code} — {e.program}
                    </p>
                    <p className="text-xs text-iua-muted">
                      {e.cohort} · {e.academic_year}
                    </p>
                  </div>
                  <span className="rounded-full bg-iua-mist px-2.5 py-1 text-[11px] font-medium text-iua-navy">
                    {enrollmentStatus[e.status] || e.status}
                  </span>
                </li>
              ))
            : enrollments.map((e) => (
                <li key={e.id} className="flex justify-between py-3">
                  <span className="text-iua-navy">
                    {e.program_name || "Formation"}
                    {e.cohort_name ? ` · ${e.cohort_name}` : ""}
                    {e.academic_year_name ? ` · ${e.academic_year_name}` : ""}
                  </span>
                  <span className="text-iua-muted">
                    {enrollmentStatus[e.status] || e.status}
                  </span>
                </li>
              ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une matière, UE, enseignant…"
          className="min-w-[14rem] flex-1 rounded-md border border-iua-navy/15 bg-white px-3 py-2 text-sm"
        />
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="rounded-md border border-iua-navy/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">Tous les semestres</option>
          {semesters.map((s) => (
            <option key={s} value={String(s)}>
              Semestre {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-5">
        {byUe.length === 0 && (
          <p className="rounded-xl bg-white p-5 text-sm text-iua-muted shadow-soft">
            Aucune matière pour ce filtre.
          </p>
        )}
        {byUe.map((ue) => (
          <section key={`${ue.semester}-${ue.code}`} className="rounded-xl bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">
                  UE {ue.code} · Semestre {ue.semester}
                </p>
                <h2 className="mt-1 font-display text-xl text-iua-navy">{ue.name}</h2>
              </div>
              <p className="text-xs text-iua-muted">{ue.credits} crédits</p>
            </div>
            <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
              {ue.subjects.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium text-iua-navy">{s.name}</p>
                    <p className="text-xs text-iua-muted">
                      {s.code}
                      {s.teacher ? ` · ${s.teacher}` : ""}
                      {` · ${s.hours} h · coef ${s.coefficient}`}
                    </p>
                    {s.latest_grade && (
                      <p className="mt-1 text-[11px] text-iua-muted">
                        Dernière note : {s.latest_label} — {s.latest_grade}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {s.avg_score != null ? (
                      <p className="font-display text-lg text-iua-navy">{s.avg_score}/20</p>
                    ) : (
                      <p className="text-xs text-iua-muted">Pas encore noté</p>
                    )}
                    <Link
                      href="/portail/etudiant/notes"
                      className="text-xs font-semibold text-iua-cyan"
                    >
                      {s.grades_count > 0
                        ? `${s.grades_count} note${s.grades_count > 1 ? "s" : ""}`
                        : "Voir notes"}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PortalShell>
  );
}
