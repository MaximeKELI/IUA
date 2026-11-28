"use client";

import { useTranslations } from "next-intl";
import { PortalShell } from "@/components/PortalShell";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";

export default function AdminNotificationsPage() {
  const tPortal = useTranslations("portal");
  const roles = getStoredUser()?.roles || [];

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <NotificationsPanel />
      <p className="sr-only">{tPortal("pages.admin.notifications")}</p>
    </PortalShell>
  );
}
