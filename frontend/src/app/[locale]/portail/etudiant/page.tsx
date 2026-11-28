"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { PortalShell } from "@/components/PortalShell";
import { ErrorState, Skeleton } from "@/components/ux";
import { apiGetCached } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { studentNav } from "@/lib/navigation";
import { useStudentHub } from "@/lib/student";

type StudentDashboard = {
  role: string;
  full_name?: string;
  profile: {
    student_number: string | null;
    program: string | null;
    program_code?: string | null;
    cohort: string | null;
    level: string | null;
    status?: string | null;
    email?: string;
  };
  enrollments_count: number;
  grades_count?: number;
  avg_score?: number | null;
  subjects_count?: number;
  pending_requests?: number;
  unread_notifications: number;
  subjects?: {
    id: string;
    name: string;
    code: string;
    teacher?: string | null;
    grades_count: number;
    avg_score?: number | null;
    hours: number;
    coefficient: string;
  }[];
  recent_grades?: {
    id: string;
    score: string;
    max_score: string;
    label: string;
    subject: string;
    subject_code: string;
    created_at: string;
  }[];
  modules: { code: string; name: string; status: string }[];
};

const QUICK_LINKS = [
  { key: "edt" as const, href: "/portail/etudiant/edt" },
  { key: "grades" as const, href: "/portail/etudiant/notes" },
  { key: "bulletin" as const, href: "/portail/etudiant/bulletin" },
  { key: "ects" as const, href: "/portail/etudiant/ects" },
  { key: "materials" as const, href: "/portail/etudiant/supports" },
  { key: "homework" as const, href: "/portail/etudiant/devoirs" },
  { key: "quizzes" as const, href: "/portail/etudiant/qcm" },
  { key: "visio" as const, href: "/portail/etudiant/visio" },
  { key: "exams" as const, href: "/portail/etudiant/examens" },
  { key: "evaluate" as const, href: "/portail/etudiant/evaluer" },
  { key: "announcements" as const, href: "/portail/etudiant/annonces" },
  { key: "attendance" as const, href: "/portail/etudiant/absences" },
  { key: "finance" as const, href: "/portail/etudiant/finance" },
  { key: "scholarships" as const, href: "/portail/etudiant/bourses" },
  { key: "library" as const, href: "/portail/etudiant/bibliotheque" },
  { key: "internships" as const, href: "/portail/etudiant/stages" },
  { key: "career" as const, href: "/portail/etudiant/carriere" },
  { key: "clubs" as const, href: "/portail/etudiant/clubs" },
  { key: "messages" as const, href: "/portail/etudiant/messages" },
  { key: "offline" as const, href: "/portail/etudiant/hors-ligne" },
];

const statusLabel: Record<string, string> = {
  active: "Inscription active",
  suspended: "Suspendu",
  graduated: "Diplômé",
  withdrawn: "Retiré",
};

export default function StudentPortalPage() {
  const tPortal = useTranslations("portal");

  const locale = useLocale();
  const t = useTranslations("portal.student");
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, ready } = useAuthToken();
  const { hub } = useStudentHub();

  useEffect(() => {
    if (!ready || !token) return;
    setLoading(true);
    apiGetCached<StudentDashboard>("/portal/student/dashboard/", token, 12_000)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [ready, token]);

  const firstName = data?.full_name?.split(" ")[0] || "";
  const subjectsWithGrades = (data?.subjects || []).filter((s) => s.grades_count > 0).slice(0, 4);

  return (
    <PortalShell title={t("space")} nav={studentNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">
        {data?.profile.status
          ? statusLabel[data.profile.status] || data.profile.status
          : t("groupPath")}
      </p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">
        {firstName ? `${t("welcome")}, ${firstName}` : t("dashboard")}
      </h1>
      <p className="mt-2 text-sm text-iua-muted">
        {[data?.profile.program, data?.profile.cohort, data?.profile.level]
          .filter(Boolean)
          .join(" · ") || "Vos notes, cours et démarches."}
      </p>

      {error && (
        <div className="mt-6">
          <ErrorState message={error} />
        </div>
      )}

      {loading && !data && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {data && (
        <div className="mt-8 space-y-8">
          {(data.unread_notifications > 0 || (data.pending_requests ?? 0) > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.unread_notifications > 0 && (
                <Link
                  href="/portail/etudiant/notifications"
                  className="flex items-center justify-between gap-3 rounded-xl bg-iua-navy px-5 py-4 text-white"
                >
                  <div>
                    <p className="font-semibold">
                      {data.unread_notifications} notification
                      {data.unread_notifications > 1 ? "s" : ""} non lue
                      {data.unread_notifications > 1 ? "s" : ""}
                    </p>
                    <p className="mt-0.5 text-sm text-white/70">Messages du campus</p>
                  </div>
                  <span className="text-xs font-semibold">Voir →</span>
                </Link>
              )}
              {(data.pending_requests ?? 0) > 0 && (
                <Link
                  href="/portail/etudiant/demandes"
                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-5 py-4 shadow-soft"
                >
                  <div>
                    <p className="font-semibold text-iua-navy">
                      {data.pending_requests} demande
                      {(data.pending_requests ?? 0) > 1 ? "s" : ""} en cours
                    </p>
                    <p className="mt-0.5 text-sm text-iua-muted">Suivi administratif</p>
                  </div>
                  <span className="text-xs font-semibold text-iua-cyan">Suivre →</span>
                </Link>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Matricule" value={data.profile.student_number || "—"} />
            <Stat
              label="Moyenne"
              value={(hub?.avg_score ?? data.avg_score) != null ? `${hub?.avg_score ?? data.avg_score}/20` : "—"}
            />
            <Stat
              label="ECTS"
              value={hub ? `${hub.ects.earned}/${hub.ects.total}` : "—"}
            />
            <Stat
              label="À payer"
              value={hub ? String(hub.finance.due_count) : "—"}
              accent={(hub?.finance.due_count ?? 0) > 0}
            />
          </div>

          {(hub?.open_homeworks || hub?.upcoming_exams || hub?.absences) ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/portail/etudiant/devoirs" className="rounded-xl bg-white px-4 py-3 text-sm shadow-soft">
                <span className="text-iua-muted">Devoirs ouverts</span>
                <p className="font-display text-2xl text-iua-navy">{hub?.open_homeworks ?? 0}</p>
              </Link>
              <Link href="/portail/etudiant/examens" className="rounded-xl bg-white px-4 py-3 text-sm shadow-soft">
                <span className="text-iua-muted">Examens à venir</span>
                <p className="font-display text-2xl text-iua-navy">{hub?.upcoming_exams ?? 0}</p>
              </Link>
              <Link href="/portail/etudiant/absences" className="rounded-xl bg-white px-4 py-3 text-sm shadow-soft">
                <span className="text-iua-muted">Absences / retards</span>
                <p className="font-display text-2xl text-iua-navy">{hub?.absences ?? 0}</p>
              </Link>
            </div>
          ) : null}

          <section>
            <h2 className="font-display text-xl text-iua-navy">20 accès étudiants</h2>
            <p className="mt-1 text-sm text-iua-muted">Parcours, études, campus et services — tout depuis un même espace.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl bg-white p-4 shadow-soft transition hover:bg-iua-mist"
                >
                  <h3 className="font-semibold text-iua-navy">{t(item.key)}</h3>
                  <p className="mt-1 text-sm text-iua-muted">{t(`hint.${item.key}` as Parameters<typeof t>[0])}</p>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-iua-navy">Dernières notes</h2>
                <Link href="/portail/etudiant/notes" className="text-xs font-semibold text-iua-cyan">
                  Tout voir
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
                {(data.recent_grades || []).length === 0 && (
                  <li className="py-3 text-iua-muted">
                    Aucune note publiée pour le moment.
                  </li>
                )}
                {(data.recent_grades || []).map((g) => {
                  const pct =
                    Number(g.max_score) > 0
                      ? Math.min(100, (Number(g.score) / Number(g.max_score)) * 100)
                      : 0;
                  return (
                    <li key={g.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-iua-navy">{g.subject}</p>
                          <p className="text-xs text-iua-muted">
                            {g.label}
                            {g.created_at
                              ? ` · ${new Date(g.created_at).toLocaleDateString(locale)}`
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

            <section className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-iua-navy">Mes matières</h2>
                <Link href="/portail/etudiant/cours" className="text-xs font-semibold text-iua-cyan">
                  Catalogue
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
                {(data.subjects || []).length === 0 && (
                  <li className="py-3 text-iua-muted">
                    Aucune matière liée à votre formation.
                  </li>
                )}
                {(subjectsWithGrades.length
                  ? subjectsWithGrades
                  : (data.subjects || []).slice(0, 4)
                ).map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-iua-navy">{s.name}</p>
                      <p className="text-xs text-iua-muted">
                        {s.code}
                        {s.teacher ? ` · ${s.teacher}` : ""}
                        {` · ${s.hours} h · coef ${s.coefficient}`}
                      </p>
                    </div>
                    <div className="text-right text-xs text-iua-muted">
                      {s.avg_score != null ? (
                        <p className="font-display text-lg text-iua-navy">{s.avg_score}/20</p>
                      ) : (
                        <p>Pas encore noté</p>
                      )}
                      {s.grades_count > 0 && (
                        <p>
                          {s.grades_count} note{s.grades_count > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">Profil</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <ProfileItem label="E-mail" value={data.profile.email || "—"} />
              <ProfileItem
                label="Formation"
                value={
                  data.profile.program_code
                    ? `${data.profile.program_code} — ${data.profile.program}`
                    : data.profile.program || "—"
                }
              />
              <ProfileItem label="Promotion" value={data.profile.cohort || "—"} />
              <ProfileItem
                label="Inscriptions actives"
                value={String(data.enrollments_count)}
              />
            </dl>
          </section>
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
      <p className="mt-2 font-display text-2xl leading-snug">{value}</p>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.12em] text-iua-muted">{label}</dt>
      <dd className="mt-1 font-medium text-iua-navy">{value}</dd>
    </div>
  );
}
