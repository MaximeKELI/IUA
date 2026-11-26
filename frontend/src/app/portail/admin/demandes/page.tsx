"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { adminNav } from "@/lib/navigation";

type AdminRequest = {
  id: string;
  requester_name: string;
  requester_email: string;
  kind: string;
  subject: string;
  body: string;
  status: string;
  admin_note: string;
};

const statuses = [
  { value: "pending", label: "En attente" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Traitée" },
  { value: "rejected", label: "Rejetée" },
];

export default function AdminDemandesPage() {
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    if (!ready || !token) return;
    const data = await apiGet<Page<AdminRequest>>("/admin-requests/?page_size=100", token);
    setItems(unwrapList(data));
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  async function updateStatus(id: string, status: string) {
    if (!ready || !token) return;
    try {
      await apiSend(`/admin-requests/${id}/`, token, "PATCH", {
        status,
        admin_note: notes[id] || "",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Administration" nav={adminNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Secrétariat</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Demandes administratives</h1>
      <p className="mt-2 text-sm text-iua-muted">Traitez les demandes déposées par les étudiants.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <ul className="mt-8 space-y-4">
        {items.length === 0 && (
          <li className="rounded-xl bg-white p-5 text-sm text-iua-muted shadow-soft">
            Aucune demande pour le moment.
          </li>
        )}
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">{item.kind}</p>
                <h2 className="mt-1 font-display text-xl text-iua-navy">{item.subject}</h2>
                <p className="mt-1 text-sm text-iua-muted">
                  {item.requester_name} · {item.requester_email}
                </p>
                {item.body && <p className="mt-3 text-sm text-iua-navy/80">{item.body}</p>}
              </div>
              <span className="rounded-full bg-iua-mist px-3 py-1 text-[11px] uppercase tracking-wide">
                {item.status}
              </span>
            </div>
            <textarea
              value={notes[item.id] ?? item.admin_note ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
              placeholder="Note interne / réponse…"
              className="mt-4 w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
              rows={2}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => updateStatus(item.id, s.value)}
                  className="rounded-md border border-iua-navy/15 px-3 py-1.5 text-xs text-iua-navy hover:bg-iua-navy hover:text-white"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
