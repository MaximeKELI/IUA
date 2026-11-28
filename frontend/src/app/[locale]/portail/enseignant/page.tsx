"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGetCached } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { teacherNav } from "@/lib/navigation";

type TeacherDashboard = {
  title?: string;
  full_name?: string;
  profile?: {
    staff_number?: string | null;
    staff_type?: string | null;
    title?: string;
    faculty?: string | null;
    department?: string | null;
  };
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
    program_id?: string | null;
    year?: string;
    cohort?: string | null;
    hours?: number;
    students_count?: number;
    grades_count?: number;
    drafts_count?: number;
    graded_students?: number;
    coverage_pct?: number;
    avg_score?: number | null;
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

const staffTypeLabel: Record<string, string> = {
  permanent: "Permanent",
  vacataire: "Vacataire",
  admin: "Administratif",
};

export default function TeacherPortalPage() {
  const t = useTranslations("portal.teacher");
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token, ready } = useAuthToken();

  useEffect(() => {
    if (!ready || !token) return;
    apiGetCached<TeacherDashboard>("/portal/teacher/dashboard/", token, 12_000)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  const greetingName = data?.full_name?.split(" ")[0] || "";
  const profileBits = [
    data?.profile?.title || data?.title,
    data?.profile?.department,
    data?.profile?.faculty,
  ].filter(Boolean);

  return (
    <PortalShell title={t("space")} nav={teacherNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">
        {data?.profile?.staff_type
          ? staffTypeLabel[data.profile.staff_type] || data.profile.staff_type
          : t("groupTeach")}
      </p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">
        {greetingName ? `${t("welcome")}, ${greetingName}` : t("welcome")}
      </h1>
      <p className="mt-2 text-sm text-iua-muted">
        {profileBits.length
          ? `${profileBits.join(" · ")}. Vos cours, étudiants et notes.`
          : "Vos cours, étudiants et notes."}
      </p>
      {error && <p className="mt-6 text-red-700">{error}</p>}

      {data && (
        <div className="mt-8 space-y-8">
          {data.drafts_count > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-iua-navy px-5 py-4 text-white">
              <div>
                <p className="font-semibold">
                  {data.drafts_count} note{data.drafts_count > 1 ? "s" : ""} en brouillon
                </p>
                <p className="mt-0.5 text-sm text-white/70">
                  Publiez-les pour les rendre visibles aux étudiants.
                </p>
              </div>
              <Link
                href="/portail/enseignant/notes"
                className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-iua-navy"
              >
                Traiter les brouillons
              </Link>
            </div>
          )}

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
              {
                href: "/portail/enseignant/notes",
                label: "Carnet de notes",
                body: "Tableau + import/export",
              },
              {
                href: "/portail/enseignant/presence",
                label: "Émargement",
                body: "Présences de séance",
              },
              {
                href: "/portail/enseignant/alertes",
                label: "Alertes pédagogiques",
                body: "Retards & couvertures",
              },
              {
                href: "/portail/enseignant/visio",
                label: "Visio Jitsi",
                body: "Salles de cours en ligne",
              },
              {
                href: "/portail/enseignant/devoirs",
                label: "Devoirs",
                body: "Deadlines & remises",
              },
              {
                href: "/portail/enseignant/qcm",
                label: "QCM",
                body: "Quiz auto-corrigés",
              },
              {
                href: "/portail/enseignant/stats",
                label: "Statistiques",
                body: "Moyennes & comparaisons",
              },
              {
                href: "/portail/enseignant/hors-ligne",
                label: "Hors-ligne",
                body: "File mobile / terrain",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl bg-white px-4 py-4 shadow-soft transition hover:bg-iua-mist"
              >
                <p className="text-sm font-semibold text-iua-navy">{item.label}</p>
                <p className="mt-1 text-xs text-iua-muted">{item.body}</p>
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
                  <li key={s.id} className="py-3">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium text-iua-navy">{s.name}</p>
                        <p className="text-xs text-iua-muted">
                          {s.code}
                          {s.program ? ` · ${s.program}` : ""}
                          {s.cohort ? ` · ${s.cohort}` : ""}
                          {s.hours != null ? ` · ${s.hours} h` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Link
                          href={`/portail/enseignant/notes?subject=${s.id}`}
                          className="text-xs font-semibold text-iua-cyan"
                        >
                          Ouvrir le carnet
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-iua-muted">
                      <span>
                        Couverture {s.graded_students ?? 0}/{s.students_count ?? 0}
                        {s.coverage_pct != null ? ` (${s.coverage_pct} %)` : ""}
                      </span>
                      {s.avg_score != null && <span>Moy. {s.avg_score}/20</span>}
                      {(s.drafts_count ?? 0) > 0 && (
                        <span className="font-semibold text-iua-navy">
                          {s.drafts_count} brouillon{(s.drafts_count ?? 0) > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-iua-mist">
                      <div
                        className="h-full rounded-full bg-iua-cyan/80 transition-all"
                        style={{ width: `${Math.min(100, s.coverage_pct ?? 0)}%` }}
                      />
                    </div>
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
