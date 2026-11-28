"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, unwrapList, type Page } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { canManageAdminRequests, resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type App = {
  id: string;
  email: string;
  country: string;
  nationality: string;
  program: string;
  status: string;
  passport: string;
  phone: string;
};

type Pending = { id: string; status: "accepted" | "rejected" | "under_review" } | null;

export default function AdminAdmissionsPage() {
  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];
  const canAct = canManageAdminRequests(roles, getStoredUser()?.permissions);
  const [rows, setRows] = useState<App[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!ready || !token) return;
    const data = await apiGet<Page<App>>("/admissions/applications/?page_size=100", token);
    setRows(unwrapList(data));
  }, [ready, token]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [load]);

  async function apply() {
    if (!token || !pending) return;
    setBusy(true);
    setError(null);
    try {
      await apiSend(`/admissions/applications/${pending.id}/review/`, token, "POST", {
        status: pending.status,
      });
      setOk(
        pending.status === "accepted"
          ? "Candidature acceptée."
          : pending.status === "rejected"
            ? "Candidature refusée."
            : "Mise en examen.",
      );
      setPending(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Admissions</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Candidatures internationales</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Dossiers soumis via le formulaire public. Validez selon votre grade.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}
      <ul className="mt-8 divide-y divide-iua-navy/10 rounded-xl bg-white shadow-soft">
        {rows.length === 0 && <li className="px-5 py-4 text-sm text-iua-muted">Aucune candidature.</li>}
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 text-sm">
            <div>
              <p className="font-medium text-iua-navy">{r.email}</p>
              <p className="text-xs text-iua-muted">
                {r.country} · {r.nationality} · {r.program || "—"} · {r.status}
              </p>
              <p className="mt-1 text-xs text-iua-muted">
                Passeport {r.passport} · {r.phone}
              </p>
            </div>
            {canAct && r.status !== "accepted" && r.status !== "rejected" && (
              <div className="flex flex-wrap gap-2">
                {r.status === "submitted" && (
                  <button
                    type="button"
                    onClick={() => setPending({ id: r.id, status: "under_review" })}
                    className="rounded-md border border-iua-navy/15 px-3 py-1.5 text-xs font-semibold"
                  >
                    Examiner
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPending({ id: r.id, status: "accepted" })}
                  className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Accepter
                </button>
                <button
                  type="button"
                  onClick={() => setPending({ id: r.id, status: "rejected" })}
                  className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Refuser
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!pending}
        title={
          pending?.status === "accepted"
            ? "Accepter cette candidature ?"
            : pending?.status === "rejected"
              ? "Refuser cette candidature ?"
              : "Passer en examen ?"
        }
        description="La décision est journalisée et visible pour le secrétariat."
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        tone={pending?.status === "rejected" ? "danger" : "default"}
        busy={busy}
        onCancel={() => {
          if (!busy) setPending(null);
        }}
        onConfirm={() => void apply()}
      />
    </PortalShell>
  );
}
