"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, Page, unwrapList } from "@/lib/api";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { getStoredUser } from "@/lib/auth";
import { useAuthToken } from "@/lib/useAuthToken";

type OutboxRow = {
  id: string;
  event_type: string;
  status: string;
  attempts: number;
  last_error: string;
  created_at: string;
};

type DeadRow = {
  id: string;
  event_type: string;
  error: string;
  handler_name: string;
  created_at: string;
};

export default function AdminEventsPage() {
  const t = useTranslations("portal");
  const tc = useTranslations("common");
  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [dead, setDead] = useState<DeadRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready) return;
    setError(null);
    try {
      const [o, d] = await Promise.all([
        apiGet<Page<OutboxRow>>("/events/outbox/?page_size=50", token),
        apiGet<Page<DeadRow>>("/events/dead-letters/?page_size=50", token),
      ]);
      setOutbox(unwrapList(o));
      setDead(unwrapList(d));
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    }
  }, [ready, token, tc]);

  useEffect(() => {
    void load();
  }, [load]);

  async function retry(id: string) {
    setBusy(id);
    try {
      await apiSend(`/events/dead-letters/${id}/retry/`, token, "POST", {});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <h1 className="font-display text-3xl text-iua-navy">{t("pages.admin.evenements")}</h1>
      <p className="mt-2 text-sm text-iua-muted">{t("admin.eventsLead")}</p>
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm font-semibold text-iua-navy"
        >
          {tc("retry")}
        </button>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl text-iua-navy">Outbox</h2>
        <ul className="mt-3 divide-y divide-iua-navy/10 rounded-xl bg-white shadow-soft">
          {outbox.length === 0 && <li className="p-4 text-sm text-iua-muted">{tc("empty")}</li>}
          {outbox.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-iua-navy">{row.event_type}</p>
                <p className="text-xs text-iua-muted">
                  {row.status} · {row.attempts} · {new Date(row.created_at).toLocaleString()}
                </p>
                {row.last_error && <p className="mt-1 text-xs text-red-700">{row.last_error}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-iua-navy">Dead letters</h2>
        <ul className="mt-3 divide-y divide-iua-navy/10 rounded-xl bg-white shadow-soft">
          {dead.length === 0 && <li className="p-4 text-sm text-iua-muted">{tc("empty")}</li>}
          {dead.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-iua-navy">{row.event_type}</p>
                <p className="text-xs text-iua-muted">
                  {row.handler_name} · {new Date(row.created_at).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-red-700">{row.error}</p>
              </div>
              <button
                type="button"
                disabled={busy === row.id}
                onClick={() => void retry(row.id)}
                className="rounded-md bg-iua-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {busy === row.id ? "…" : tc("retry")}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </PortalShell>
  );
}
