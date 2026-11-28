"use client";

import { useTranslations } from "next-intl";

import { PortalShell } from "@/components/PortalShell";
import { directionNav } from "@/lib/navigation";
import { useDirectionHub } from "@/lib/ops";

export default function AlumniPage() {
  const tPortal = useTranslations("portal");

  const { hub } = useDirectionHub();
  return (
    <PortalShell title={tPortal("direction.space")} nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.direction.alumni")}</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Suivi du réseau alumni IUA à l&apos;international.
      </p>
      <div className="mt-8 rounded-xl bg-white p-6 shadow-soft">
        <p className="text-xs uppercase text-iua-muted">Alumni à l&apos;étranger</p>
        <p className="mt-2 font-display text-4xl text-iua-navy">
          {hub?.international.alumni_abroad ?? "—"}
        </p>
        <p className="mt-4 text-sm text-iua-muted">
          Communautés pays et LinkedIn Alumni IUA — indicateur consolidé direction.
        </p>
      </div>
    </PortalShell>
  );
}
