"use client";

import { useTranslations } from "next-intl";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, unwrapList, type Page } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  canOverseeCatchUps,
  resolveOpsNav,
  resolveOpsTitle,
} from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type CatchUp = {
  id: string;
  subject_name?: string;
  student_name?: string;
  reason: string;
  preferred_date: string | null;
  status: string;
  teacher_note: string;
  session_label: string;
};

type Pending = { id: string; status: "approved" | "rejected" } | null;

export default function AdminRattrapagesPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];
  const canAct = canOverseeCatchUps(roles);
  const [items, setItems] = useState<CatchUp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!ready || !token) return;
    const data = await apiGet<Page<CatchUp>>("/catchups/?page_size=100", token);
    setItems(unwrapList(data));
  }, [ready, token]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [load]);

  async function apply() {
    if (!token || !pending) return;
    setBusy(true);
    setError(null);
    try {
      await apiSend(`/catchups/${pending.id}/`, token, "PATCH", { status: pending.status });
      setOk(pending.status === "approved" ? "Rattrapage approuvé." : "Rattrapage refusé.");
      setPending(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setBusy(false);
    }
  }

  const open = items.filter((i) => i.status === "pending");

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Supervision académique</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">{tPortal("pages.admin.rattrapages")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">
        Les enseignants créent et gèrent les dossiers. Secrétariat, direction académique et direction
        peuvent valider en supervision.
      </p>
      {!canAct && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Votre grade ne permet pas de valider les rattrapages.
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}
      <p className="mt-6 text-sm text-iua-muted">{open.length} en attente</p>
      <ul className="mt-4 divide-y divide-iua-navy/10 rounded-xl bg-white shadow-soft">
        {items.length === 0 && <li className="px-5 py-4 text-sm text-iua-muted">Aucun dossier.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 text-sm">
            <div>
              <p className="font-medium text-iua-navy">
                {item.student_name || "Étudiant"} · {item.subject_name || "Matière"}
              </p>
              <p className="mt-1 text-xs text-iua-muted">
                {item.session_label} · {item.status}
                {item.preferred_date ? ` · souhaité ${item.preferred_date}` : ""}
              </p>
              <p className="mt-2 text-iua-navy/80">{item.reason}</p>
            </div>
            {canAct && item.status === "pending" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPending({ id: item.id, status: "approved" })}
                  className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Approuver
                </button>
                <button
                  type="button"
                  onClick={() => setPending({ id: item.id, status: "rejected" })}
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
        title={pending?.status === "approved" ? "Approuver le rattrapage ?" : "Refuser le rattrapage ?"}
        description="Cette décision est tracée et visible par l'enseignant concerné."
        confirmLabel={pending?.status === "approved" ? "Approuver" : "Refuser"}
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
