"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { teacherNav } from "@/lib/navigation";

type AdminRequest = {
  id: string;
  kind: string;
  subject: string;
  body: string;
  status: string;
  admin_note: string;
  created_at: string;
};

const statusLabel: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  done: "Traitée",
  rejected: "Refusée",
};

export default function TeacherDemandesPage() {
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    kind: "other",
    subject: "",
    body: "",
  });

  async function load() {
    if (!ready || !token) return;
    const data = await apiGet<Page<AdminRequest>>("/admin-requests/?page_size=50", token);
    setItems(unwrapList(data));
  }

  useEffect(() => {
    if (!ready || !token) return;
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !token) return;
    setSending(true);
    setError(null);
    setOk(null);
    try {
      await apiSend("/admin-requests/", token, "POST", {
        kind: form.kind,
        subject: form.subject.trim(),
        body: form.body.trim(),
      });
      setOk("Demande envoyée au secrétariat.");
      setForm({ kind: "other", subject: "", body: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setSending(false);
    }
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Demandes</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Attestation, matériel, planning… adressez-vous au secrétariat depuis ici.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Nouvelle demande</h2>
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="other">Demande interne</option>
            <option value="attestation">Attestation</option>
            <option value="certificate">Certificat</option>
            <option value="transcript">Relevé</option>
          </select>
          <input
            required
            placeholder="Objet"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Précisions"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            rows={4}
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Envoi…" : "Envoyer"}
          </button>
        </form>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Mes demandes</h2>
          <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
            {items.length === 0 && <li className="py-3 text-iua-muted">Rien pour le moment.</li>}
            {items.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex justify-between gap-2">
                  <p className="font-medium text-iua-navy">{item.subject}</p>
                  <span className="text-xs uppercase text-iua-muted">
                    {statusLabel[item.status] || item.status}
                  </span>
                </div>
                {item.admin_note && (
                  <p className="mt-1 text-xs text-iua-muted">Réponse : {item.admin_note}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
