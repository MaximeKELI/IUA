"use client";

import { useTranslations } from "next-intl";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, unwrapList, type Page } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { canManageAdminRequests, resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type Row = {
  id: string;
  student?: string;
  label?: string;
  amount_xof?: number;
  status?: string;
  due_date?: string;
};

export default function AdminPaiementsPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];
  const canConfirm = canManageAdminRequests(roles, getStoredUser()?.permissions);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!ready || !token) return;
    const d = await apiGet<Page<Row> | { results: Row[] } | Row[]>("/ops/payments/", token);
    setRows(Array.isArray(d) ? d : unwrapList(d as Page<Row>));
  }, [ready, token]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [load]);

  async function confirm() {
    if (!token || !pendingId) return;
    setBusy(true);
    setError(null);
    try {
      await apiSend(`/payments/${pendingId}/confirm/`, token, "POST", {
        note: "Confirmation manuelle secrétariat",
      });
      setOk("Paiement confirmé.");
      setPendingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.admin.paiements")}</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Suivi des paiements. Confirmez la réception manuellement ou via webhook signé.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}
      <div className="mt-8 overflow-x-auto rounded-xl bg-white shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-iua-mist text-left text-xs uppercase tracking-wide text-iua-muted">
            <tr>
              <th className="px-4 py-3">Étudiant</th>
              <th className="px-4 py-3">Libellé</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Échéance</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-iua-navy/10">
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-iua-muted" colSpan={6}>
                  Aucune donnée
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.student ?? "—"}</td>
                <td className="px-4 py-3">{r.label ?? "—"}</td>
                <td className="px-4 py-3">{r.amount_xof ?? "—"}</td>
                <td className="px-4 py-3">{r.status ?? "—"}</td>
                <td className="px-4 py-3">{r.due_date ?? "—"}</td>
                <td className="px-4 py-3">
                  {canConfirm && r.status !== "paid" ? (
                    <button
                      type="button"
                      onClick={() => setPendingId(r.id)}
                      className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Confirmer réception
                    </button>
                  ) : (
                    <span className="text-xs text-iua-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingId}
        title={tPortal("admin.space")}
        description="Le statut passera à « Payé ». Cette action est journalisée."
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        busy={busy}
        onCancel={() => {
          if (!busy) setPendingId(null);
        }}
        onConfirm={() => void confirm()}
      />
    </PortalShell>
  );
}
