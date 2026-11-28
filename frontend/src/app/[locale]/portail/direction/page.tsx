"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { Link } from "@/i18n/navigation";
import { apiGetCached } from "@/lib/api";
import { directionNav } from "@/lib/navigation";
import { useDirectionHub } from "@/lib/ops";
import { useAuthToken } from "@/lib/useAuthToken";

type DirectionDashboard = {
  kpis: Record<string, number>;
  students_by_faculty: { faculty: string; total: number }[];
  recent_requests?: {
    id: string;
    subject: string;
    status: string;
    kind: string;
    requester: string;
  }[];
  note: string;
};

const labels: Record<string, string> = {
  students: "Étudiants",
  teachers: "Enseignants",
  faculties: "Facultés",
  programs: "Formations",
  enrollments: "Inscriptions",
  pending_requests: "Demandes en attente",
  grades_published: "Notes publiées",
  teaching_assignments: "Affectations cours",
};

const QUICK = [
  { href: "/portail/direction/effectifs", title: "Effectifs", body: "Par faculté" },
  { href: "/portail/direction/performance", title: "Performance", body: "Moyennes & réussite" },
  { href: "/portail/direction/international", title: "International", body: "Rayonnement" },
  { href: "/portail/direction/finance", title: "Finance", body: "Synthèse paiements" },
  { href: "/portail/direction/demandes", title: "Demandes", body: "File admin" },
  { href: "/portail/direction/qualite", title: "Qualité", body: "Évaluations cours" },
  { href: "/portail/direction/alertes", title: "Alertes", body: "Absences / retards" },
  { href: "/portail/direction/pv", title: "PV", body: "Signatures notes" },
  { href: "/portail/direction/calendrier", title: "Calendrier", body: "Examens" },
  { href: "/portail/direction/partenariats", title: "Partenaires", body: "Mobilité" },
  { href: "/portail/direction/alumni", title: "Alumni", body: "Réseau abroad" },
  { href: "/portail/direction/rapports", title: "Rapports", body: "Export CSV" },
  { href: "/portail/direction/affectations", title: "Affectations", body: "Lecture cours" },
  { href: "/portail/direction/notes", title: "Notes", body: "Notes publiées" },
  { href: "/portail/direction/annonces", title: "Annonces", body: "Institutionnelles" },
  { href: "/portail/direction/comptes", title: "Comptes", body: "Supervision" },
  { href: "/portail/direction/journal", title: "Journal", body: "Audit" },
  { href: "/portail/direction/notifications", title: "Notifications", body: "Alertes" },
  { href: "/portail/direction/etablissement", title: "Établissement", body: "Fiche IUA" },
  { href: "/portail/admin", title: "Ops secrétariat", body: "Vue opérationnelle" },
];

export default function DirectionPortalPage() {
  const tPortal = useTranslations("portal");

  const [data, setData] = useState<DirectionDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token, ready } = useAuthToken();
  const { hub } = useDirectionHub();
  const ti = useTranslations("portal.direction");

  useEffect(() => {
    if (!ready || !token) return;
    apiGetCached<DirectionDashboard>("/portal/direction/dashboard/", token, 15_000)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  const intl = hub?.international;

  return (
    <PortalShell title={tPortal("direction.space")} nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.direction.home")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">
        Pilotage IUA — 20 accès direction (KPI, qualité, ouverture, gouvernance).
      </p>
      {error && <p className="mt-6 text-red-700">{error}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Étudiants" value={String(hub?.students ?? data?.kpis.students ?? "—")} />
        <Stat label="Moyenne" value={hub?.avg_score != null ? `${hub.avg_score}/20` : "—"} />
        <Stat label="Réussite" value={hub?.pass_rate != null ? `${hub.pass_rate}%` : "—"} />
        <Stat
          label="Demandes"
          value={String(hub?.pending_requests ?? data?.kpis.pending_requests ?? "—")}
          accent={(hub?.pending_requests ?? 0) > 0}
        />
      </div>

      {data && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.kpis)
            .filter(([k]) => !["students", "pending_requests"].includes(k))
            .slice(0, 4)
            .map(([key, value]) => (
              <div key={key} className="rounded-xl bg-white p-4 shadow-soft">
                <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">
                  {labels[key] || key}
                </p>
                <p className="mt-1 font-display text-2xl text-iua-navy">{value}</p>
              </div>
            ))}
        </div>
      )}

      <section className="mt-8 rounded-xl bg-iua-navy p-6 text-white">
        <h2 className="font-display text-xl">{ti("intlKpiTitle")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-white/60">{ti("intlStudents")}</p>
            <p className="mt-1 font-display text-3xl">{intl?.students ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-white/60">{ti("intlShare")}</p>
            <p className="mt-1 font-display text-3xl">{intl ? `${intl.share_pct}%` : "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-white/60">{ti("intlCountries")}</p>
            <p className="mt-1 font-display text-3xl">{intl?.countries ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-white/60">{ti("alumniAbroad")}</p>
            <p className="mt-1 font-display text-3xl">{intl?.alumni_abroad ?? "—"}</p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-iua-navy">20 accès direction</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl bg-white p-4 shadow-soft transition hover:bg-iua-mist"
            >
              <h3 className="font-semibold text-iua-navy">{item.title}</h3>
              <p className="mt-1 text-sm text-iua-muted">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {data && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">Effectifs par faculté</h2>
            <ul className="mt-4 divide-y divide-iua-navy/10">
              {data.students_by_faculty.map((row) => (
                <li key={row.faculty} className="flex justify-between py-3 text-sm">
                  <span>{row.faculty}</span>
                  <span className="font-semibold text-iua-navy">{row.total}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl text-iua-navy">Demandes récentes</h2>
              <Link href="/portail/direction/demandes" className="text-xs font-semibold text-iua-cyan">
                Voir →
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
              {(data.recent_requests || []).map((req) => (
                <li key={req.id} className="py-3">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-iua-navy">{req.subject}</p>
                    <span className="text-xs uppercase text-iua-muted">{req.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-iua-muted">
                    {req.requester} · {req.kind}
                  </p>
                </li>
              ))}
            </ul>
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
