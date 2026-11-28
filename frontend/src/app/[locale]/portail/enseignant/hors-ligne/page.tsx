"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PortalShell } from "@/components/PortalShell";
import { apiSend, clearApiMemoryCache } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { OfflineGradeOp, readOfflineQueue, writeOfflineQueue } from "@/lib/teacher";
import { useAuthToken } from "@/lib/useAuthToken";

export default function HorsLignePage() {
  const { token, ready } = useAuthToken();
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<OfflineGradeOp[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    setQueue(readOfflineQueue());
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function syncAll() {
    if (!token || !navigator.onLine) {
      setError("Connexion requise pour synchroniser.");
      return;
    }
    setSyncing(true);
    setError(null);
    setMsg(null);
    const pending = readOfflineQueue();
    const remaining: OfflineGradeOp[] = [];
    let okCount = 0;
    for (const op of pending) {
      try {
        await apiSend(op.path, token, op.method, op.payload);
        okCount += 1;
      } catch {
        remaining.push(op);
      }
    }
    writeOfflineQueue(remaining);
    setQueue(remaining);
    clearApiMemoryCache();
    setMsg(`${okCount} opération(s) synchronisée(s). ${remaining.length} en échec/restantes.`);
    setSyncing(false);
  }

  function clearQueue() {
    writeOfflineQueue([]);
    setQueue([]);
    setConfirmClear(false);
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Mode hors-ligne</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">
        Saisissez des notes même sans réseau : elles sont mises en file locale puis synchronisées dès
        le retour de connexion (préparation app mobile / usage terrain).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">Réseau</p>
          <p className={`mt-2 font-display text-2xl ${online ? "text-emerald-700" : "text-red-700"}`}>
            {online ? "En ligne" : "Hors ligne"}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">File d&apos;attente</p>
          <p className="mt-2 font-display text-2xl text-iua-navy">{queue.length}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">Session</p>
          <p className="mt-2 text-sm text-iua-muted">{ready ? "Prête" : "Chargement…"}</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={syncing || !online || queue.length === 0}
          onClick={() => void syncAll()}
          className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {syncing ? "Synchronisation…" : "Synchroniser maintenant"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="rounded-md border border-iua-navy/15 px-5 py-2.5 text-sm font-semibold text-iua-navy"
        >
          Vider la file
        </button>
      </div>

      <ul className="mt-8 space-y-2">
        {queue.length === 0 && (
          <li className="rounded-xl bg-white p-5 text-sm text-iua-muted shadow-soft">
            Aucune opération en attente. Depuis le carnet, les saisies hors-ligne s&apos;ajoutent ici
            automatiquement.
          </li>
        )}
        {queue.map((op) => (
          <li key={op.id} className="rounded-xl bg-white p-4 text-sm shadow-soft">
            <p className="font-medium text-iua-navy">
              {op.method} {op.path}
            </p>
            <p className="text-xs text-iua-muted">{new Date(op.at).toLocaleString("fr-FR")}</p>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmClear}
        title="Vider la file hors-ligne ?"
        description="Les opérations non synchronisées seront définitivement perdues."
        confirmLabel="Vider"
        cancelLabel="Annuler"
        tone="danger"
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearQueue}
      />
    </PortalShell>
  );
}
