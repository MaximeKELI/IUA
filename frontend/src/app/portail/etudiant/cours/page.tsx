"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiGetCached, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { studentNav } from "@/lib/navigation";

type Dashboard = {
  profile: { program: string | null; cohort: string | null; student_number: string | null };
  enrollments_count: number;
};

type Enrollment = {
  id: string;
  status: string;
  program: string;
  cohort: string;
  academic_year: string;
  program_name?: string;
  cohort_name?: string;
  academic_year_name?: string;
};

type Subject = { id: string; name: string; code: string; hours: number; coefficient: string };

export default function StudentCoursPage() {
  const { token, ready } = useAuthToken();
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    Promise.all([
      apiGetCached<Dashboard>("/portal/student/dashboard/", token, 15_000),
      apiGet<Page<Enrollment>>("/enrollments/?page_size=50", token),
      apiGet<Page<Subject>>("/subjects/?page_size=100", token),
    ])
      .then(([d, e, s]) => {
        setDash(d);
        setEnrollments(unwrapList(e));
        setSubjects(unwrapList(s));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Parcours</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Cours & matières</h1>
      {dash && (
        <p className="mt-2 text-sm text-iua-muted">
          {dash.profile.program || "Formation non affectée"}
          {dash.profile.cohort ? ` · ${dash.profile.cohort}` : ""} · {dash.enrollments_count} inscription(s)
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <section className="mt-8 rounded-xl bg-white p-5 shadow-soft">
        <h2 className="font-display text-xl text-iua-navy">Inscriptions</h2>
        <ul className="mt-3 divide-y divide-iua-navy/10 text-sm">
          {enrollments.length === 0 && <li className="py-3 text-iua-muted">Pas encore inscrit.</li>}
          {enrollments.map((e) => (
            <li key={e.id} className="flex justify-between py-3">
              <span className="text-iua-navy">
                {e.program_name || "Formation"}
                {e.cohort_name ? ` · ${e.cohort_name}` : ""}
                {e.academic_year_name ? ` · ${e.academic_year_name}` : ""}
              </span>
              <span className="text-iua-muted">{e.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl bg-white p-5 shadow-soft">
        <h2 className="font-display text-xl text-iua-navy">Matières du catalogue</h2>
        <ul className="mt-3 divide-y divide-iua-navy/10 text-sm">
          {subjects.map((s) => (
            <li key={s.id} className="flex justify-between py-3">
              <span>
                <span className="font-medium text-iua-navy">{s.name}</span>
                <span className="ml-2 text-iua-muted">{s.code}</span>
              </span>
              <span className="text-iua-muted">
                {s.hours}h · coef {s.coefficient}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </PortalShell>
  );
}
