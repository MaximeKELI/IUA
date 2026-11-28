"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type AdminRequest = {
  id: string;
  requester_name: string;
  requester_email: string;
  kind: string;
  subject: string;
  body: string;
  status: string;
  admin_note: string;
  created_at?: string;
};

const kindLabel: Record<string, string> = {
  attestation: "Attestation de scolarité",
  transcript: "Relevé de notes",
  certificate: "Certificat",
  other: "Autre",
};

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-900" },
  in_progress: { label: "En cours", className: "bg-sky-100 text-sky-900" },
  done: { label: "Accordée / traitée", className: "bg-emerald-100 text-emerald-900" },
  rejected: { label: "Refusée", className: "bg-red-100 text-red-800" },
};

export default function AdminDemandesPage() {
  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "done" | "rejected">(
    "pending",
  );

  async function load() {
    if (!ready || !token) return;
    const data = await apiGet<Page<AdminRequest>>("/admin-requests/?page_size=100", token);
    setItems(unwrapList(data));
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const pendingCount = items.filter((i) => i.status === "pending").length;

  async function updateStatus(id: string, status: string) {
    if (!ready || !token) return;
    setError(null);
    setOk(null);
    try {
      await apiSend(`/admin-requests/${id}/`, token, "PATCH", {
        status,
        admin_note: notes[id] || "",
      });
      setOk(
        status === "done"
          ? "Demande accordée — l'étudiant est notifié."
          : status === "rejected"
            ? "Demande refusée — l'étudiant est notifié."
            : "Statut mis à jour.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Secrétariat</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Demandes administratives</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">
        C&apos;est le <strong>secrétariat</strong> (ou l&apos;admin) qui accorde ou refuse les demandes
        d&apos;attestation, relevé, certificat, etc. Les enseignants ne traitent pas ces demandes.
      </p>
      {pendingCount > 0 && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente de traitement.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["pending", "À traiter"],
            ["in_progress", "En cours"],
            ["done", "Traitées"],
            ["rejected", "Refusées"],
            ["all", "Toutes"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              filter === value ? "bg-iua-navy text-white" : "bg-white text-iua-navy shadow-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="mt-8 space-y-4">
        {visible.length === 0 && (
          <li className="rounded-xl bg-white p-5 text-sm text-iua-muted shadow-soft">
            Aucune demande dans ce filtre.
          </li>
        )}
        {visible.map((item) => {
          const meta = statusMeta[item.status] || statusMeta.pending;
          return (
            <li key={item.id} className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">
                    {kindLabel[item.kind] || item.kind}
                  </p>
                  <h2 className="mt-1 font-display text-xl text-iua-navy">{item.subject}</h2>
                  <p className="mt-1 text-sm text-iua-muted">
                    {item.requester_name} · {item.requester_email}
                  </p>
                  {item.body && <p className="mt-3 text-sm text-iua-navy/80">{item.body}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.className}`}>
                  {meta.label}
                </span>
              </div>
              <textarea
                value={notes[item.id] ?? item.admin_note ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                placeholder="Note / réponse à l'étudiant…"
                className="mt-4 w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                rows={2}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void updateStatus(item.id, "in_progress")}
                  className="rounded-md border border-iua-navy/15 bg-white px-3 py-2 text-xs font-semibold text-iua-navy hover:bg-iua-mist"
                >
                  Prendre en charge
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(item.id, "done")}
                  className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Accorder / traiter
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(item.id, "rejected")}
                  className="rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                >
                  Refuser
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </PortalShell>
  );
}
