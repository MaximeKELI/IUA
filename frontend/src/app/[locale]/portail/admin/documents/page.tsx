"use client";

import { useTranslations } from "next-intl";

import { AdminRequestWorkbench } from "@/components/AdminRequestWorkbench";
import { PortalShell } from "@/components/PortalShell";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

export default function AdminDocumentsPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <AdminRequestWorkbench
        token={token}
        ready={ready}
        roles={roles}
        layout="table"
        eyebrow="Documents"
        title={tPortal("admin.space")}
        lead="Demandes d'attestation, relevé et certificat. Validez ou refusez selon votre grade ; une note destinée au demandeur peut accompagner la décision."
      />
    </PortalShell>
  );
}
