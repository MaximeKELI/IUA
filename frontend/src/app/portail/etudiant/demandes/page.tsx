"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { studentNav } from "@/lib/navigation";

type AdminRequest = {
  id: string;
  kind: string;
  subject: string;
  body: string;
  status: string;
  admin_note: string;
  created_at: string;
};

export default function StudentDemandesPage() {
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState({
    kind: "attestation",
    subject: "",
    body: "",
  });

  async function load() {
    if (!ready || !token) return;
    const data = await apiGet<Page<AdminRequest>>("/admin-requests/?page_size=50", token);
    setItems(unwrapList(data));
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !token) return;
    setError(null);
    try {
      await apiSend("/admin-requests/", token, "POST", form);
      setOk("Demande envoyée au secrétariat.");
      setForm({ kind: "attestation", subject: "", body: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Démarches</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Demandes administratives</h1>
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
            <option value="attestation">Attestation de scolarité</option>
            <option value="transcript">Relevé de notes</option>
            <option value="certificate">Certificat</option>
            <option value="other">Autre</option>
          </select>
          <input
            required
            placeholder="Objet"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Précisions…"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            rows={4}
          />
          <button type="submit" className="rounded-md bg-iua-navy px-4 py-2.5 text-sm text-white">
            Envoyer
          </button>
        </form>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Mes demandes</h2>
          <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
            {items.length === 0 && <li className="py-3 text-iua-muted">Aucune demande.</li>}
            {items.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex justify-between gap-2">
                  <p className="font-medium text-iua-navy">{item.subject}</p>
                  <span className="text-xs uppercase text-iua-muted">{item.status}</span>
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
