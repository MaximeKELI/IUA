"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGetCached } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useOpsHub } from "@/lib/ops";
import { useAuthToken } from "@/lib/useAuthToken";

type AdminDashboard = {
  stats: Record<string, number>;
};

const labels: Record<string, string> = {
  users: "Utilisateurs",
  students: "Étudiants",
  faculties: "Facultés",
  programs: "Formations",
  enrollments: "Inscriptions",
};

const QUICK = [
  { href: "/portail/admin/utilisateurs", title: "Utilisateurs", body: "Comptes & rôles" },
  { href: "/portail/admin/formations", title: "Formations", body: "UE & matières" },
  { href: "/portail/admin/cohortes", title: "Cohortes", body: "Promotions" },
  { href: "/portail/admin/inscriptions", title: "Inscriptions", body: "Scolarité" },
  { href: "/portail/admin/enseignements", title: "Affectations", body: "Enseignants" },
  { href: "/portail/admin/edt", title: "EDT global", body: "Créneaux" },
  { href: "/portail/admin/presences", title: "Présences", body: "Absences export" },
  { href: "/portail/admin/notes", title: "Notes", body: "Consultation" },
  { href: "/portail/admin/examens", title: "Examens", body: "Calendrier" },
  { href: "/portail/admin/demandes", title: "Demandes", body: "Traitement" },
  { href: "/portail/admin/documents", title: "Documents", body: "Attestations" },
  { href: "/portail/admin/paiements", title: "Paiements", body: "Échéances" },
  { href: "/portail/admin/annonces", title: "Annonces", body: "Campus" },
  { href: "/portail/admin/import", title: "Import CSV", body: "Étudiants" },
  { href: "/portail/admin/cartes", title: "Cartes", body: "Profils" },
  { href: "/portail/admin/stages", title: "Stages", body: "Conventions" },
  { href: "/portail/admin/bourses", title: "Bourses", body: "Suivi" },
  { href: "/portail/admin/notifications", title: "Notifications", body: "Campus" },
  { href: "/portail/admin/file", title: "File d'attente", body: "Pending" },
  { href: "/portail/direction", title: "Direction", body: "Pilotage KPI" },
];

export default function AdminPortalPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roles = getStoredUser()?.roles || [];
  const { token, ready } = useAuthToken();
  const { hub } = useOpsHub();

  useEffect(() => {
    if (!ready || !token) return;
    apiGetCached<AdminDashboard>("/portal/admin/dashboard/", token, 20_000)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <h1 className="font-display text-3xl text-iua-navy">Vue d&apos;ensemble</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Secrétariat / administration — 20 accès opérationnels.
      </p>
      {error && <p className="mt-6 text-red-700">{error}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Demandes" value={String(hub?.pending_requests ?? "—")} accent={(hub?.pending_requests ?? 0) > 0} />
        <Stat label="À payer" value={String(hub?.payments_due ?? "—")} />
        <Stat label="Examens" value={String(hub?.upcoming_exams ?? "—")} />
        <Stat label="Étudiants" value={String(hub?.students ?? data?.stats.students ?? "—")} />
      </div>

      {data && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data.stats).map(([key, value]) => (
            <div key={key} className="rounded-xl bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">
                {labels[key] || key}
              </p>
              <p className="mt-2 font-display text-3xl text-iua-navy">{value}</p>
            </div>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl text-iua-navy">20 accès secrétariat</h2>
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
