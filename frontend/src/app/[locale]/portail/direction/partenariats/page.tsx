"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { directionNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Row = Record<string, unknown>;

export default function DirPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Page<Row> | { results: Row[] } | Row[]>("/ops/partners/", token)
      .then((d) => setRows(Array.isArray(d) ? d : unwrapList(d as Page<Row>)))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [ready, token]);
  const cols: [string, string][] = [["name", "Partenaire"], ["region", "Région"], ["focus", "Focus"], ["country", "Pays"]];
  return (
    <PortalShell title={tPortal("direction.space")} nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.direction.partenariats")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Universités et réseaux partenaires.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 overflow-x-auto rounded-xl bg-white shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-iua-mist text-left text-xs uppercase tracking-wide text-iua-muted">
            <tr>{cols.map(([k, l]) => <th key={k} className="px-4 py-3">{l}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-iua-navy/10">
            {rows.length === 0 && (
              <tr><td className="px-4 py-4 text-iua-muted" colSpan={cols.length}>Aucune donnée</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={String(r.id ?? i)}>
                {cols.map(([k]) => (
                  <td key={k} className="px-4 py-3">{String(r[k] ?? "—")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
