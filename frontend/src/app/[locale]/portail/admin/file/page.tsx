"use client";

import { AdminRequestWorkbench } from "@/components/AdminRequestWorkbench";
import { PortalShell } from "@/components/PortalShell";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

export default function AdminFilePage() {
  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <AdminRequestWorkbench
        token={token}
        ready={ready}
        roles={roles}
        layout="table"
        eyebrow="File d'attente"
        title="File d'attente opérationnelle"
        lead="Tous les dossiers en attente ou en cours. Traitez-les ici : prise en charge, accord ou refus — avec confirmation avant chaque décision."
      />
    </PortalShell>
  );
}
