"use client";

import { PortalShell } from "@/components/PortalShell";
import { studentNav } from "@/lib/navigation";
import { useStudentHub } from "@/lib/student";
import { Link } from "@/i18n/navigation";

export default function EctsPage() {
  const { hub, error } = useStudentHub();

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">Progression ECTS</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Crédits acquis vs volume du programme (estimation basée sur les matières validées ≥ 10/20).
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {hub && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">Progression</p>
            <p className="mt-2 font-display text-4xl text-iua-navy">
              {hub.ects.earned} / {hub.ects.total} ECTS
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-iua-mist">
              <div
                className="h-full rounded-full bg-iua-cyan"
                style={{ width: `${Math.min(100, hub.ects.pct)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-iua-muted">{hub.ects.pct}% du parcours estimé</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-soft">
              <p className="text-xs uppercase text-iua-muted">Moyenne générale</p>
              <p className="mt-2 font-display text-3xl text-iua-navy">
                {hub.avg_score ?? "—"}/20
              </p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-soft">
              <p className="text-xs uppercase text-iua-muted">Correspondances</p>
              <p className="mt-2 text-sm text-iua-muted">
                1 année ≈ 60 ECTS · Licence ≈ 180 · Master ≈ 120
              </p>
              <Link href="/international/ects" className="mt-3 inline-flex text-sm font-semibold text-iua-cyan">
                Guide ECTS international →
              </Link>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
