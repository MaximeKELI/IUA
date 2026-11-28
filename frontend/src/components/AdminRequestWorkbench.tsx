"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { apiGet, apiSend, unwrapList, type Page } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { canManageAdminRequests } from "@/lib/portalCapabilities";

export type AdminRequestRow = {
  id: string;
  requester_name?: string;
  requester_email?: string;
  requester?: string;
  kind: string;
  subject: string;
  body?: string;
  status: string;
  admin_note?: string;
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
  done: { label: "Accordée", className: "bg-emerald-100 text-emerald-900" },
  rejected: { label: "Refusée", className: "bg-red-100 text-red-800" },
};

type Filter = "all" | "pending" | "in_progress" | "done" | "rejected";
type PendingAction = { id: string; action: "claim" | "approve" | "reject" } | null;

type Props = {
  token: string | null;
  ready: boolean;
  roles: string[];
  /** Compact table layout (file/documents) vs card list (demandes). */
  layout?: "cards" | "table";
  title?: string;
  lead?: string;
  eyebrow?: string;
};

export function AdminRequestWorkbench({
  token,
  ready,
  roles,
  layout = "cards",
  title = "Demandes administratives",
  lead = "Accordez, refusez ou prenez en charge les demandes étudiants et enseignants selon votre grade.",
  eyebrow = "Validation",
}: Props) {
  const canManage = canManageAdminRequests(roles, getStoredUser()?.permissions);
  const [items, setItems] = useState<AdminRequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("pending");
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!ready || !token) return;
    const data = await apiGet<Page<AdminRequestRow>>("/admin-requests/?page_size=100", token);
    setItems(unwrapList(data));
  }, [ready, token]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [load]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const pendingCount = items.filter((i) => i.status === "pending" || i.status === "in_progress").length;

  function requesterLabel(item: AdminRequestRow) {
    return item.requester_name || item.requester || "—";
  }

  async function runAction(id: string, action: "claim" | "approve" | "reject") {
    if (!token || !canManage) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const note = notes[id] || "";
      await apiSend(`/admin-requests/${id}/${action}/`, token, "POST", {
        admin_note: note,
      });
      setOk(
        action === "approve"
          ? "Demande accordée — le demandeur est notifié."
          : action === "reject"
            ? "Demande refusée — le demandeur est notifié."
            : "Demande prise en charge.",
      );
      setPending(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du traitement");
    } finally {
      setBusy(false);
    }
  }

  const confirmCopy =
    pending?.action === "approve"
      ? {
          title: "Accorder cette demande ?",
          description:
            "La demande passera au statut « Accordée ». Le demandeur recevra une notification immédiate.",
          confirmLabel: "Accorder",
          tone: "default" as const,
        }
      : pending?.action === "reject"
        ? {
            title: "Refuser cette demande ?",
            description:
              "La demande sera refusée. Ajoutez une note claire si possible — elle sera visible par le demandeur.",
            confirmLabel: "Refuser",
            tone: "danger" as const,
          }
        : {
            title: "Prendre en charge ?",
            description: "Vous devenez le traitement en cours. Les autres agents verront le statut « En cours ».",
            confirmLabel: "Prendre en charge",
            tone: "default" as const,
          };

  function ActionButtons({ item }: { item: AdminRequestRow }) {
    if (!canManage) return null;
    if (item.status !== "pending" && item.status !== "in_progress") {
      return <span className="text-xs text-iua-muted">Décision enregistrée</span>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {item.status === "pending" && (
          <button
            type="button"
            onClick={() => setPending({ id: item.id, action: "claim" })}
            className="rounded-md border border-iua-navy/15 bg-white px-3 py-2 text-xs font-semibold text-iua-navy hover:bg-iua-mist"
          >
            Prendre en charge
          </button>
        )}
        <button
          type="button"
          onClick={() => setPending({ id: item.id, action: "approve" })}
          className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
        >
          Accorder
        </button>
        <button
          type="button"
          onClick={() => setPending({ id: item.id, action: "reject" })}
          className="rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
        >
          Refuser
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">{lead}</p>

      {!canManage && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          Votre grade ne permet pas de valider ces demandes. Contactez le secrétariat ou la direction.
        </p>
      )}
      {pendingCount > 0 && canManage && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {pendingCount} dossier{pendingCount > 1 ? "s" : ""} à traiter.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {ok && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["pending", "À traiter"],
            ["in_progress", "En cours"],
            ["done", "Accordées"],
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

      {layout === "table" ? (
        <div className="mt-8 overflow-x-auto rounded-xl bg-white shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="bg-iua-mist text-left text-xs uppercase tracking-wide text-iua-muted">
              <tr>
                <th className="px-4 py-3">Demandeur</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Objet</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-iua-navy/10">
              {visible.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-iua-muted" colSpan={6}>
                    Aucune demande dans ce filtre.
                  </td>
                </tr>
              )}
              {visible.map((item) => {
                const meta = statusMeta[item.status] || statusMeta.pending;
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-iua-navy">{requesterLabel(item)}</p>
                      {item.requester_email && (
                        <p className="text-xs text-iua-muted">{item.requester_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{kindLabel[item.kind] || item.kind}</td>
                    <td className="px-4 py-3">{item.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[180px]">
                      {canManage && (item.status === "pending" || item.status === "in_progress") ? (
                        <input
                          value={notes[item.id] ?? item.admin_note ?? ""}
                          onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                          placeholder="Note au demandeur…"
                          className="w-full rounded-md border border-iua-navy/15 px-2 py-1.5 text-xs"
                        />
                      ) : (
                        <span className="text-xs text-iua-muted">{item.admin_note || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActionButtons item={item} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
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
                      {requesterLabel(item)}
                      {item.requester_email ? ` · ${item.requester_email}` : ""}
                    </p>
                    {item.body && <p className="mt-3 text-sm text-iua-navy/80">{item.body}</p>}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </div>
                {canManage && (item.status === "pending" || item.status === "in_progress") && (
                  <textarea
                    value={notes[item.id] ?? item.admin_note ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                    placeholder="Note / réponse au demandeur…"
                    className="mt-4 w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                    rows={2}
                  />
                )}
                <div className="mt-3">
                  <ActionButtons item={item} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!pending}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        cancelLabel="Annuler"
        tone={confirmCopy.tone}
        busy={busy}
        onCancel={() => {
          if (!busy) setPending(null);
        }}
        onConfirm={() => {
          if (pending) void runAction(pending.id, pending.action);
        }}
      />
    </>
  );
}
