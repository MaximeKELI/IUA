"use client";

import { useTranslations } from "next-intl";
import { PortalShell } from "@/components/PortalShell";
import { Link } from "@/i18n/navigation";
import { directionNav } from "@/lib/navigation";
import { useDirectionHub } from "@/lib/ops";

export default function IntlPage() {
  const tPortal = useTranslations("portal");

  const { hub } = useDirectionHub();
  const i = hub?.international;
  return (
    <PortalShell title={tPortal("direction.space")} nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.direction.international")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Indicateurs étudiants étrangers, pays et partenaires.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Étudiants étrangers", i?.students],
          ["Part internationale", i ? `${i.share_pct}%` : null],
          ["Pays d'origine", i?.countries],
          ["Alumni abroad", i?.alumni_abroad],
        ].map(([l,v]) => (
          <div key={String(l)} className="rounded-xl bg-white p-5 shadow-soft">
            <p className="text-xs uppercase text-iua-muted">{l}</p>
            <p className="mt-2 font-display text-3xl text-iua-navy">{v ?? "—"}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm">Partenaires actifs : <strong>{hub?.partners ?? 0}</strong></p>
      <Link href="/portail/direction/partenariats" className="mt-3 inline-flex text-sm font-semibold text-iua-cyan">Voir les partenariats →</Link>
    </PortalShell>
  );
}
