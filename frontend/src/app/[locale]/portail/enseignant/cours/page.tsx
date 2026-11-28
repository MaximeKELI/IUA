"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiGetCached, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { teacherNav } from "@/lib/navigation";

type Assignment = {
  id: string;
  subject: string;
  subject_name: string;
  subject_code: string;
  academic_year: string;
  academic_year_name?: string;
  cohort_name?: string | null;
  program_id?: string;
  program_name?: string;
  hours?: number;
  coefficient?: string | number;
};

type SubjectStat = {
  id: string;
  students_count?: number;
  grades_count?: number;
  drafts_count?: number;
  graded_students?: number;
  coverage_pct?: number;
  avg_score?: number | null;
};

type TeacherDashboard = {
  subjects: SubjectStat[];
};

export default function TeacherCoursPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Record<string, SubjectStat>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    Promise.all([
      apiGet<Page<Assignment>>("/teaching-assignments/?page_size=100", token),
      apiGetCached<TeacherDashboard>("/portal/teacher/dashboard/", token, 12_000),
    ])
      .then(([a, dash]) => {
        setItems(unwrapList(a));
        const map: Record<string, SubjectStat> = {};
        for (const s of dash.subjects || []) map[s.id] = s;
        setStats(map);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  const totals = useMemo(() => {
    const values = Object.values(stats);
    return {
      students: values.reduce((n, s) => n + (s.students_count || 0), 0),
      grades: values.reduce((n, s) => n + (s.grades_count || 0), 0),
      drafts: values.reduce((n, s) => n + (s.drafts_count || 0), 0),
    };
  }, [stats]);

  return (
    <PortalShell title={tPortal("teacher.space")} nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.teacher.cours")}</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Matières qui vous sont affectées pour l’année — avec couverture des notes.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {items.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-iua-muted">
          <span>
            <strong className="text-iua-navy">{items.length}</strong> cours
          </span>
          <span>
            <strong className="text-iua-navy">{totals.students}</strong> étudiants concernés
          </span>
          <span>
            <strong className="text-iua-navy">{totals.grades}</strong> notes
          </span>
          {totals.drafts > 0 && (
            <span>
              <strong className="text-iua-navy">{totals.drafts}</strong> brouillons
            </span>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.length === 0 && (
          <p className="rounded-xl bg-white p-5 text-sm text-iua-muted shadow-soft md:col-span-2">
            Aucune affectation. Le secrétariat doit vous rattacher à une matière.
          </p>
        )}
        {items.map((a) => {
          const s = stats[a.subject];
          return (
            <article key={a.id} className="rounded-xl bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">{a.subject_code}</p>
              <h2 className="mt-2 font-display text-xl text-iua-navy">{a.subject_name}</h2>
              <dl className="mt-4 space-y-1 text-sm text-iua-muted">
                {a.program_name && (
                  <div className="flex justify-between gap-3">
                    <dt>Formation</dt>
                    <dd className="text-right text-iua-navy">{a.program_name}</dd>
                  </div>
                )}
                {a.academic_year_name && (
                  <div className="flex justify-between gap-3">
                    <dt>Année</dt>
                    <dd className="text-right text-iua-navy">{a.academic_year_name}</dd>
                  </div>
                )}
                {a.cohort_name && (
                  <div className="flex justify-between gap-3">
                    <dt>Promotion</dt>
                    <dd className="text-right text-iua-navy">{a.cohort_name}</dd>
                  </div>
                )}
                {a.hours != null && (
                  <div className="flex justify-between gap-3">
                    <dt>Volume</dt>
                    <dd className="text-right text-iua-navy">{a.hours} h</dd>
                  </div>
                )}
                {a.coefficient != null && (
                  <div className="flex justify-between gap-3">
                    <dt>Coefficient</dt>
                    <dd className="text-right text-iua-navy">{a.coefficient}</dd>
                  </div>
                )}
              </dl>

              {s && (
                <div className="mt-4 rounded-lg bg-iua-mist/70 px-3 py-3">
                  <div className="flex justify-between text-xs text-iua-muted">
                    <span>
                      Couverture {s.graded_students ?? 0}/{s.students_count ?? 0}
                    </span>
                    <span>{s.coverage_pct ?? 0} %</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-iua-cyan/80"
                      style={{ width: `${Math.min(100, s.coverage_pct ?? 0)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-iua-muted">
                    <span>{s.grades_count ?? 0} notes</span>
                    {s.avg_score != null && <span>Moy. {s.avg_score}/20</span>}
                    {(s.drafts_count ?? 0) > 0 && (
                      <span className="font-semibold text-iua-navy">
                        {s.drafts_count} brouillon{(s.drafts_count ?? 0) > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/portail/enseignant/notes?subject=${a.subject}`}
                  className="rounded-md bg-iua-navy px-3 py-2 text-xs font-semibold text-white"
                >
                  Ouvrir le carnet
                </Link>
                <Link
                  href={
                    a.program_id
                      ? `/portail/enseignant/etudiants?program=${a.program_id}`
                      : "/portail/enseignant/etudiants"
                  }
                  className="rounded-md border border-iua-navy/15 px-3 py-2 text-xs font-semibold text-iua-navy"
                >
                  Étudiants
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </PortalShell>
  );
}
