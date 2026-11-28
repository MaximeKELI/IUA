"use client";
import { PortalShell } from "@/components/PortalShell";
import { directionNav } from "@/lib/navigation";
import { useDirectionHub } from "@/lib/ops";

export default function EffectifsPage() {
  const { hub, error } = useDirectionHub();
  return (
    <PortalShell title="Direction" nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">Effectifs par faculté</h1>
      <p className="mt-2 text-sm text-iua-muted">Répartition des étudiants inscrits.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(hub?.by_faculty || []).map((f) => (
          <div key={f.faculty} className="rounded-xl bg-white p-5 shadow-soft">
            <p className="text-xs uppercase text-iua-muted">{f.faculty}</p>
            <p className="mt-2 font-display text-3xl text-iua-navy">{f.total}</p>
          </div>
        ))}
        {!hub?.by_faculty?.length && <p className="text-sm text-iua-muted">Aucun effectif.</p>}
      </div>
      <p className="mt-6 text-sm text-iua-muted">Total étudiants : <strong>{hub?.students ?? "—"}</strong> · Enseignants : <strong>{hub?.teachers ?? "—"}</strong></p>
    </PortalShell>
  );
}
