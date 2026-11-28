"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { directionNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Row = {
  id: string;
  subject: string;
  teacher: string;
  overall: number;
  clarity: number;
  comment: string;
};

export default function QualityPage() {
  const { token, ready } = useAuthToken();
  const [rows, setRows] = useState<Row[]>([]);
  const [avg, setAvg] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<{ averages: Record<string, number | null>; results: Row[] }>(
      "/direction/quality/",
      token,
    ).then((d) => {
      setRows(d.results || []);
      setAvg(d.averages || {});
    });
  }, [ready, token]);

  return (
    <PortalShell title="Direction" nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">Qualité enseignement</h1>
      <p className="mt-2 text-sm text-iua-muted">Moyennes des évaluations étudiants (1–5).</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {["clarity", "usefulness", "pacing", "overall"].map((k) => (
          <div key={k} className="rounded-xl bg-white p-4 shadow-soft">
            <p className="text-xs uppercase text-iua-muted">{k}</p>
            <p className="font-display text-2xl text-iua-navy">
              {avg[k] != null ? Number(avg[k]).toFixed(1) : "—"}
            </p>
          </div>
        ))}
      </div>
      <ul className="mt-8 divide-y divide-iua-navy/10 rounded-xl bg-white text-sm shadow-soft">
        {rows.map((r) => (
          <li key={r.id} className="px-5 py-3">
            <p className="font-medium text-iua-navy">
              {r.subject} — {r.teacher}
            </p>
            <p className="text-iua-muted">
              Global {r.overall}/5 · {r.comment || "Sans commentaire"}
            </p>
          </li>
        ))}
        {!rows.length && <li className="px-5 py-4 text-iua-muted">Aucune évaluation.</li>}
      </ul>
    </PortalShell>
  );
}
