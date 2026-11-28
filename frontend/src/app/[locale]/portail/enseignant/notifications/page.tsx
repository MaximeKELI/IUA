"use client";

import { useTranslations } from "next-intl";

import { PortalShell } from "@/components/PortalShell";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { teacherNav } from "@/lib/navigation";

export default function TeacherNotificationsPage() {
  const tPortal = useTranslations("portal");

  return (
    <PortalShell title={tPortal("teacher.space")} nav={teacherNav}>
      <NotificationsPanel />
    </PortalShell>
  );
}
