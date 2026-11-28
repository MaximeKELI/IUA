"use client";

import { useTranslations } from "next-intl";
import { PortalShell } from "@/components/PortalShell";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { directionNav } from "@/lib/navigation";

export default function DirectionNotificationsPage() {
  const tPortal = useTranslations("portal");

  return (
    <PortalShell title={tPortal("direction.space")} nav={directionNav}>
      <NotificationsPanel />
      <p className="sr-only">{tPortal("pages.direction.notifications")}</p>
    </PortalShell>
  );
}
