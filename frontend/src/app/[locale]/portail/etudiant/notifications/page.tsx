"use client";

import { useTranslations } from "next-intl";

import { PortalShell } from "@/components/PortalShell";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { studentNav } from "@/lib/navigation";

export default function StudentNotificationsPage() {
  const tPortal = useTranslations("portal");

  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <NotificationsPanel />
    </PortalShell>
  );
}
