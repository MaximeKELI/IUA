"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { directionNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Row = {
  id: string;
  requester_name?: string;
  kind: string;
  subject: string;
  status: string;
  admin_note?: string;
};

export default function DirectionDemandesPage() {
  const { token, ready } = useAuthToken();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    const data = await apiGet<Page<Row>>("/admin-requests/?page_size=100", token);
    setRows(unwrapList(data));
  }

  useEffect(() => {
    if (!ready || !token) return;
    load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  async function setStatus(id: string, status: string) {
    if (!token) return;
    try {
      await apiSend(`/admin-requests/${id}/`, token, "PATCH", { status });
      setMsg(status === "done" ? "Demande accordée." : "Statut mis à jour.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  const pending = rows.filter((r) => r.status === "pending");

  return (
    <PortalShell title="Direction" nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">Demandes administratives</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Traitement normalement assuré par le <strong>secrétariat</strong>. La direction peut aussi
        accorder ou refuser en supervision.
      </p>
      <Link href="/portail/admin/demandes" className="mt-3 inline-flex text-sm font-semibold text-iua-cyan">
        Ouvrir la file secrétariat →
      </Link>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      <p className="mt-6 text-sm text-iua-muted">{pending.length} en attente</p>
      <ul className="mt-4 divide-y divide-iua-navy/10 rounded-xl bg-white shadow-soft">
        {rows.length === 0 && <li className="px-5 py-4 text-sm text-iua-muted">Aucune demande.</li>}
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
            <div>
              <p className="font-medium text-iua-navy">{r.subject}</p>
              <p className="text-xs text-iua-muted">
                {r.requester_name || "—"} · {r.kind} · {r.status}
              </p>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void setStatus(r.id, "done")}
                  className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Accorder
                </button>
                <button
                  type="button"
                  onClick={() => void setStatus(r.id, "rejected")}
                  className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Refuser
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
