"use client";

import { PortalShell } from "@/components/PortalShell";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { teacherNav } from "@/lib/navigation";

export default function TeacherNotificationsPage() {
  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <NotificationsPanel />
    </PortalShell>
  );
}
