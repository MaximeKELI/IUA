"use client";

import { PortalShell } from "@/components/PortalShell";
import { directionNav } from "@/lib/navigation";
import { useDirectionHub } from "@/lib/ops";

export default function ReportsPage() {
  const { hub } = useDirectionHub();

  function exportCsv() {
    if (!hub) return;
    const lines = [
      "metric,value",
      `students,${hub.students}`,
      `teachers,${hub.teachers}`,
      `avg_score,${hub.avg_score ?? ""}`,
      `pass_rate,${hub.pass_rate ?? ""}`,
      `pending_requests,${hub.pending_requests}`,
      `due_amount,${hub.finance.due_amount}`,
      `absences,${hub.absences}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "iua-direction-kpi.csv";
    a.click();
  }

  return (
    <PortalShell title="Direction" nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">Rapports export</h1>
      <p className="mt-2 text-sm text-iua-muted">Téléchargez un CSV des indicateurs clés.</p>
      <button
        type="button"
        onClick={exportCsv}
        className="mt-8 rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white"
      >
        Exporter CSV
      </button>
    </PortalShell>
  );
}
