"use client";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { directionNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Row = { subject: string; avg: number; count: number; pass_rate: number };

export default function PerformancePage() {
  const { token, ready } = useAuthToken();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!ready || !token) return;
    apiGet<{ subjects: Row[] }>("/direction/performance/", token)
      .then((d) => setRows(d.subjects || []))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [ready, token]);
  return (
    <PortalShell title="Direction" nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">Performance académique</h1>
      <p className="mt-2 text-sm text-iua-muted">Moyennes /20 et taux de réussite (≥ 10).</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <ul className="mt-8 divide-y divide-iua-navy/10 rounded-xl bg-white shadow-soft">
        {rows.map((r) => (
          <li key={r.subject} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
            <span className="font-medium text-iua-navy">{r.subject}</span>
            <span>{r.avg}/20 · {r.pass_rate}% · {r.count} notes</span>
          </li>
        ))}
        {!rows.length && <li className="px-5 py-4 text-iua-muted">Pas encore de notes publiées.</li>}
      </ul>
    </PortalShell>
  );
}
