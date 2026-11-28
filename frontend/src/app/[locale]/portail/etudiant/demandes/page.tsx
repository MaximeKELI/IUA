"use client";

import { useLocale } from "next-intl";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

const statusLabel: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  done: "Traitée",
  rejected: "Refusée",
};

const statusClass: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  in_progress: "bg-sky-50 text-sky-800",
  done: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
};

const kindLabels: Record<string, string> = {
  attestation: "Attestation de scolarité",
  transcript: "Relevé de notes",
  certificate: "Certificat",
  other: "Autre",
};

const presets: Record<string, { subject: string; body: string }> = {
  attestation: {
    subject: "Attestation de scolarité",
    body: "Bonjour, je souhaite obtenir une attestation de scolarité pour l’année en cours.",
  },
  transcript: {
    subject: "Relevé de notes",
    body: "Bonjour, je souhaite un relevé de notes officiel de mon semestre / année.",
  },
  certificate: {
    subject: "Certificat de scolarité",
    body: "Bonjour, merci de me délivrer un certificat de scolarité.",
  },
  other: { subject: "", body: "" },
};

export default function StudentDemandesPage() {
  const locale = useLocale();
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    kind: "attestation",
    subject: presets.attestation.subject,
    body: presets.attestation.body,
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

  const filtered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const counts = useMemo(() => {
    const c = { pending: 0, in_progress: 0, done: 0, rejected: 0 };
    for (const i of items) {
      if (i.status in c) c[i.status as keyof typeof c] += 1;
    }
    return c;
  }, [items]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !token) {
      setError("Session non prête. Rechargez la page.");
      return;
    }
    if (!form.subject.trim()) {
      setError("Indiquez l'objet de votre demande.");
      return;
    }
    setSending(true);
    setError(null);
    setOk(null);
    try {
      await apiSend("/admin-requests/", token, "POST", {
        kind: form.kind,
        subject: form.subject.trim(),
        body: form.body.trim(),
      });
      setOk("Demande envoyée. Le secrétariat la traitera sous peu.");
      const next = presets.attestation;
      setForm({ kind: "attestation", subject: next.subject, body: next.body });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setSending(false);
    }
  }

  function applyKind(kind: string) {
    const preset = presets[kind] || presets.other;
    setForm({
      kind,
      subject: preset.subject,
      body: preset.body,
    });
  }

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Démarches</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Demandes administratives</h1>
      <p className="mt-2 max-w-xl text-sm text-iua-muted">
        Attestation de scolarité, relevé de notes, certificat… Déposez et suivez vos demandes ici.
      </p>
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {(
          [
            ["pending", "En attente"],
            ["in_progress", "En cours"],
            ["done", "Traitées"],
            ["rejected", "Refusées"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter((v) => (v === key ? "" : key))}
            className={`rounded-xl p-4 text-left shadow-soft transition ${
              statusFilter === key ? "bg-iua-navy text-white" : "bg-white"
            }`}
          >
            <p
              className={`text-xs uppercase tracking-[0.12em] ${
                statusFilter === key ? "text-white/60" : "text-iua-muted"
              }`}
            >
              {label}
            </p>
            <p className="mt-1 font-display text-2xl">{counts[key]}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Nouvelle demande</h2>
          <label className="block text-sm">
            <span className="mb-1 block text-iua-muted">Type</span>
            <select
              value={form.kind}
              onChange={(e) => applyKind(e.target.value)}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            >
              {Object.entries(kindLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-iua-muted">Objet</span>
            <input
              required
              placeholder="Ex. Attestation pour stage"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-iua-muted">Précisions</span>
            <textarea
              placeholder="Contexte, délai souhaité…"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
              rows={5}
            />
          </label>
          <button
            type="submit"
            disabled={sending || !ready}
            className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-iua-blue disabled:opacity-60"
          >
            {sending ? "Envoi…" : "Envoyer la demande"}
          </button>
        </form>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-iua-navy">Mes demandes</h2>
            {statusFilter && (
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className="text-xs font-semibold text-iua-cyan"
              >
                Tout afficher
              </button>
            )}
          </div>
          <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
            {filtered.length === 0 && (
              <li className="py-3 text-iua-muted">
                {items.length === 0
                  ? "Aucune demande pour l'instant."
                  : "Aucune demande pour ce filtre."}
              </li>
            )}
            {filtered.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-iua-navy">{item.subject}</p>
                    <p className="mt-1 text-xs text-iua-muted">
                      {kindLabels[item.kind] || item.kind} ·{" "}
                      {new Date(item.created_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      statusClass[item.status] || "bg-iua-mist text-iua-navy"
                    }`}
                  >
                    {statusLabel[item.status] || item.status}
                  </span>
                </div>
                {item.body && (
                  <p className="mt-2 line-clamp-2 text-xs text-iua-muted">{item.body}</p>
                )}
                {item.admin_note && (
                  <p className="mt-2 rounded-md bg-iua-mist/80 px-3 py-2 text-xs text-iua-navy">
                    Réponse du secrétariat : {item.admin_note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
