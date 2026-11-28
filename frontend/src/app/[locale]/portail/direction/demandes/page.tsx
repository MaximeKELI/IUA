"use client";

import { Link } from "@/i18n/navigation";
import { AdminRequestWorkbench } from "@/components/AdminRequestWorkbench";
import { PortalShell } from "@/components/PortalShell";
import { getStoredUser } from "@/lib/auth";
import { directionNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

export default function DirectionDemandesPage() {
  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];

  return (
    <PortalShell title="Direction" nav={directionNav}>
      <AdminRequestWorkbench
        token={token}
        ready={ready}
        roles={roles}
        layout="cards"
        eyebrow="Supervision direction"
        title="Demandes administratives"
        lead="Traitement normalement assuré par le secrétariat. La direction peut accorder ou refuser en supervision, avec traçabilité et notification du demandeur."
      />
      <Link
        href="/portail/admin/file"
        className="mt-8 inline-flex text-sm font-semibold text-iua-cyan hover:underline"
      >
        Ouvrir la file opérationnelle →
      </Link>
    </PortalShell>
  );
}
