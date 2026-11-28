"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Insights = {
  alerts: { level: string; code: string; message: string }[];
  kpis: Record<string, number | null>;
};

const tone: Record<string, string> = {
  danger: "bg-red-50 text-red-800 border-red-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  info: "bg-sky-50 text-sky-900 border-sky-200",
};

export default function AlertesPage() {
  const { token, ready } = useAuthToken();
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Insights>("/teacher/insights/", token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Alertes & retards de saisie</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Brouillons non publiés, absences, devoirs échus, couvertures faibles et rattrapages en attente.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {data && (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Brouillons", data.kpis.drafts],
              ["Absences (7j)", data.kpis.recent_absences],
              ["Rattrapages", data.kpis.pending_catchups],
              ["Devoirs échus", data.kpis.overdue_homeworks],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-white p-5 shadow-soft">
                <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">{label}</p>
                <p className="mt-2 font-display text-3xl text-iua-navy">{value ?? 0}</p>
              </div>
            ))}
          </div>

          <ul className="mt-8 space-y-3">
            {data.alerts.length === 0 && (
              <li className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-800">
                Aucune alerte — votre suivi est à jour.
              </li>
            )}
            {data.alerts.map((a, i) => (
              <li
                key={`${a.code}-${i}`}
                className={`rounded-xl border px-5 py-4 text-sm ${tone[a.level] || tone.info}`}
              >
                {a.message}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/portail/enseignant/notes" className="rounded-md bg-iua-navy px-4 py-2 text-sm font-semibold text-white">
              Ouvrir le carnet
            </Link>
            <Link href="/portail/enseignant/devoirs" className="rounded-md border border-iua-navy/15 px-4 py-2 text-sm font-semibold text-iua-navy">
              Devoirs
            </Link>
            <Link href="/portail/enseignant/rattrapages" className="rounded-md border border-iua-navy/15 px-4 py-2 text-sm font-semibold text-iua-navy">
              Rattrapages
            </Link>
          </div>
        </>
      )}
    </PortalShell>
  );
}
