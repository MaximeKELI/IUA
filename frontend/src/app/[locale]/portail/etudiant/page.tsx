"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { PortalShell } from "@/components/PortalShell";
import { apiGetCached } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { studentNav } from "@/lib/navigation";

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

const statusLabel: Record<string, string> = {
  active: "Inscription active",
  suspended: "Suspendu",
  graduated: "Diplômé",
  withdrawn: "Retiré",
};

export default function StudentPortalPage() {
  const locale = useLocale();
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token, ready } = useAuthToken();

  useEffect(() => {
    if (!ready || !token) return;
    apiGetCached<StudentDashboard>("/portal/student/dashboard/", token, 12_000)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  const firstName = data?.full_name?.split(" ")[0] || "";
  const subjectsWithGrades = (data?.subjects || []).filter((s) => s.grades_count > 0).slice(0, 4);

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">
        {data?.profile.status
          ? statusLabel[data.profile.status] || data.profile.status
          : "Parcours"}
      </p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">
        {firstName ? `Bonjour, ${firstName}` : "Tableau de bord"}
      </h1>
      <p className="mt-2 text-sm text-iua-muted">
        {[data?.profile.program, data?.profile.cohort, data?.profile.level]
          .filter(Boolean)
          .join(" · ") || "Vos notes, cours et démarches."}
      </p>

      {error && <p className="mt-6 text-red-700">{error}</p>}

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
              value={data.avg_score != null ? `${data.avg_score}/20` : "—"}
            />
            <Stat label="Notes publiées" value={String(data.grades_count ?? 0)} />
            <Stat
              label="Notifications"
              value={String(data.unread_notifications)}
              accent={data.unread_notifications > 0}
            />
          </div>

          <section>
            <h2 className="font-display text-xl text-iua-navy">Accès rapides</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Notes",
                  body:
                    data.grades_count && data.grades_count > 0
                      ? `${data.grades_count} résultat${data.grades_count > 1 ? "s" : ""}`
                      : "Moyennes et résultats",
                  href: "/portail/etudiant/notes",
                },
                {
                  title: "Cours",
                  body: `${data.subjects_count ?? 0} matière${(data.subjects_count ?? 0) > 1 ? "s" : ""}`,
                  href: "/portail/etudiant/cours",
                },
                {
                  title: "Demandes",
                  body:
                    (data.pending_requests ?? 0) > 0
                      ? `${data.pending_requests} en cours`
                      : "Attestations et relevés",
                  href: "/portail/etudiant/demandes",
                },
                {
                  title: "Notifications",
                  body:
                    data.unread_notifications > 0
                      ? `${data.unread_notifications} non lue${data.unread_notifications > 1 ? "s" : ""}`
                      : "Messages du campus",
                  href: "/portail/etudiant/notifications",
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-xl bg-white p-5 shadow-soft transition hover:bg-iua-mist"
                >
                  <h3 className="font-semibold text-iua-navy">{item.title}</h3>
                  <p className="mt-1 text-sm text-iua-muted">{item.body}</p>
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
