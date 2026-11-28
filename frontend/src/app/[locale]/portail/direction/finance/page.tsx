"use client";
import { PortalShell } from "@/components/PortalShell";
import { directionNav } from "@/lib/navigation";
import { useDirectionHub } from "@/lib/ops";

export default function FinanceDirPage() {
  const { hub, error } = useDirectionHub();
  const f = hub?.finance;
  return (
    <PortalShell title="Direction" nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">Synthèse finance</h1>
      <p className="mt-2 text-sm text-iua-muted">Vue consolidée des paiements étudiants.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-soft"><p className="text-xs uppercase text-iua-muted">À encaisser</p><p className="mt-2 font-display text-3xl text-iua-navy">{f?.due_count ?? "—"}</p></div>
        <div className="rounded-xl bg-white p-5 shadow-soft"><p className="text-xs uppercase text-iua-muted">Montant dû</p><p className="mt-2 font-display text-2xl text-iua-navy">{(f?.due_amount ?? 0).toLocaleString("fr-FR")} XOF</p></div>
        <div className="rounded-xl bg-white p-5 shadow-soft"><p className="text-xs uppercase text-iua-muted">Payés</p><p className="mt-2 font-display text-3xl text-iua-navy">{f?.paid_count ?? "—"}</p></div>
        <div className="rounded-xl bg-white p-5 shadow-soft"><p className="text-xs uppercase text-iua-muted">Encaissé</p><p className="mt-2 font-display text-2xl text-iua-navy">{(f?.paid_amount ?? 0).toLocaleString("fr-FR")} XOF</p></div>
      </div>
    </PortalShell>
  );
}
