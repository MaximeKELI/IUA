"use client";

import { useTranslations } from "next-intl";

import { AdminRequestWorkbench } from "@/components/AdminRequestWorkbench";
import { PortalShell } from "@/components/PortalShell";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

export default function AdminDemandesPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <AdminRequestWorkbench
        token={token}
        ready={ready}
        roles={roles}
        layout="cards"
        eyebrow={roles.includes("secretariat") ? "Secrétariat" : "Administration"}
        title={tPortal("admin.space")}
        lead="Le secrétariat, l'administration et la direction peuvent prendre en charge, accorder ou refuser les demandes d'attestation, relevé, certificat, etc. Chaque décision notifie le demandeur."
      />
    </PortalShell>
  );
}
