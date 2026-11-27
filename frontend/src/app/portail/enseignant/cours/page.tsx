"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, Page, unwrapList } from "@/lib/api";
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

export default function TeacherCoursPage() {
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Page<Assignment>>("/teaching-assignments/?page_size=100", token)
      .then((data) => setItems(unwrapList(data)))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Mes cours</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Matières qui vous sont affectées pour l’année.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.length === 0 && (
          <p className="rounded-xl bg-white p-5 text-sm text-iua-muted shadow-soft md:col-span-2">
            Aucune affectation. Le secrétariat doit vous rattacher à une matière.
          </p>
        )}
        {items.map((a) => (
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
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/portail/enseignant/notes?subject=${a.subject}`}
                className="rounded-md bg-iua-navy px-3 py-2 text-xs font-semibold text-white"
              >
                Saisir des notes
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
        ))}
      </div>
    </PortalShell>
  );
}
