"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, PageLoading } from "@/components/ux";
import { apiGet, apiSend, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";

type Notification = {
  id: string;
  title: string;
  body: string;
  category: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationsPanel() {
  const tc = useTranslations("common");
  const locale = useLocale();
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await apiGet<Page<Notification>>("/notifications/?page_size=50");
    setItems(unwrapList(data));
  }

  useEffect(() => {
    if (!ready || !token) return;
    setLoading(true);
    setError(null);
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [ready, token]);

  async function markAll() {
    await apiSend("/notifications/read-all/", token, "POST", {});
    await load();
  }

  async function markOne(id: string) {
    await apiSend(`/notifications/${id}/read/`, token, "POST", {});
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Alertes</p>
          <h1 className="mt-2 font-display text-3xl text-iua-navy">Notifications</h1>
        </div>
        <button
          type="button"
          disabled={loading || items.length === 0}
          onClick={() => markAll().catch((err) => setError(err.message))}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm disabled:opacity-50"
        >
          Tout marquer lu
        </button>
      </div>
      {error && (
        <div className="mt-4">
          <ErrorState message={error} onRetry={() => {
            setLoading(true);
            setError(null);
            load()
              .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
              .finally(() => setLoading(false));
          }} />
        </div>
      )}
      {loading ? (
        <PageLoading />
      ) : (
        <ul className="mt-8 space-y-3">
          {items.length === 0 && (
            <li>
              <EmptyState title={tc("empty")} description="Aucune notification." />
            </li>
          )}
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl p-5 shadow-soft ${n.is_read ? "bg-white" : "bg-iua-navy text-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-xs uppercase tracking-wide ${n.is_read ? "text-iua-muted" : "text-white/60"}`}>
                    {n.category}
                    {n.created_at
                      ? ` · ${new Date(n.created_at).toLocaleString(locale)}`
                      : ""}
                  </p>
                  <h2 className="mt-1 font-semibold">{n.title}</h2>
                  <p className={`mt-1 text-sm ${n.is_read ? "text-iua-muted" : "text-white/80"}`}>{n.body}</p>
                </div>
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={() => markOne(n.id).catch((err) => setError(err.message))}
                    className="rounded border border-white/30 px-2 py-1 text-xs"
                  >
                    Lu
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
