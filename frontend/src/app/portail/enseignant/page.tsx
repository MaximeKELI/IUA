"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGetCached } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { teacherNav } from "@/lib/navigation";

type TeacherDashboard = {
  title?: string;
  assignments_count: number;
  students_count: number;
  grades_count: number;
  drafts_count: number;
  unread_notifications: number;
  subjects: {
    id: string;
    name: string;
    code: string;
    program?: string | null;
    year?: string;
    hours?: number;
  }[];
  recent_grades: {
    id: string;
    score: string;
    max_score: string;
    label: string;
    is_published: boolean;
    subject: string;
    student: string;
    created_at: string;
  }[];
};

export default function TeacherPortalPage() {
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token, ready } = useAuthToken();

  useEffect(() => {
    if (!ready || !token) return;
    apiGetCached<TeacherDashboard>("/portal/teacher/dashboard/", token, 12_000)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Bonjour</h1>
      <p className="mt-2 text-sm text-iua-muted">
        {data?.title
          ? `${data.title}. Voici l’état de vos cours et notes.`
          : "Vos cours, étudiants et notes."}
      </p>
      {error && <p className="mt-6 text-red-700">{error}</p>}

      {data && (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Cours" value={String(data.assignments_count)} />
            <Stat label="Étudiants" value={String(data.students_count)} />
            <Stat label="Notes saisies" value={String(data.grades_count)} />
            <Stat
              label="Non publiées"
              value={String(data.drafts_count)}
              accent={data.drafts_count > 0}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/portail/enseignant/notes", label: "Saisir une note" },
              { href: "/portail/enseignant/cours", label: "Voir mes cours" },
              { href: "/portail/enseignant/etudiants", label: "Liste des étudiants" },
              { href: "/portail/enseignant/notifications", label: `Alertes (${data.unread_notifications})` },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl bg-white px-4 py-4 text-sm font-semibold text-iua-navy shadow-soft transition hover:bg-iua-mist"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-iua-navy">Mes matières</h2>
                <Link href="/portail/enseignant/cours" className="text-xs font-semibold text-iua-cyan">
                  Détail
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-iua-navy/10">
                {data.subjects.length === 0 && (
                  <li className="py-3 text-sm text-iua-muted">
                    Aucun cours affecté. Contactez le secrétariat.
                  </li>
                )}
                {data.subjects.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium text-iua-navy">{s.name}</p>
                      <p className="text-xs text-iua-muted">
                        {s.code}
                        {s.program ? ` · ${s.program}` : ""}
                        {s.hours != null ? ` · ${s.hours} h` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/portail/enseignant/notes?subject=${s.id}`}
                      className="shrink-0 text-xs font-semibold text-iua-cyan"
                    >
                      Notes
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-iua-navy">Dernières notes</h2>
                <Link href="/portail/enseignant/notes" className="text-xs font-semibold text-iua-cyan">
                  Tout voir
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
                {data.recent_grades.length === 0 && (
                  <li className="py-3 text-iua-muted">Aucune note pour l’instant.</li>
                )}
                {data.recent_grades.map((g) => (
                  <li key={g.id} className="flex justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-iua-navy">{g.student}</p>
                      <p className="text-xs text-iua-muted">
                        {g.subject} · {g.label}
                        {!g.is_published ? " · brouillon" : ""}
                      </p>
                    </div>
                    <span className="font-display text-lg text-iua-navy">
                      {g.score}/{g.max_score}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 ${accent ? "bg-iua-navy text-white" : "bg-white shadow-soft"}`}>
      <p className={`text-xs uppercase tracking-[0.14em] ${accent ? "text-white/60" : "text-iua-muted"}`}>
        {label}
      </p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
