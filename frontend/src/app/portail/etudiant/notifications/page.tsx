"use client";

import { PortalShell } from "@/components/PortalShell";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { studentNav } from "@/lib/navigation";

export default function StudentNotificationsPage() {
  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <NotificationsPanel />
    </PortalShell>
  );
}
