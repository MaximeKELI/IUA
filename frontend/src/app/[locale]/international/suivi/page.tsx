"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { PublicPage } from "@/components/PublicPage";
import { ErrorState, PageLoading } from "@/components/ux";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/$/, "");

type TrackPayload = {
  tracking_token: string;
  status: string;
  status_label: string;
  program: string;
  email: string;
  created_at: string;
  reviewed_at: string | null;
};

function SuiviForm() {
  const search = useSearchParams();
  const initial = search.get("token") || "";
  const [token, setToken] = useState(initial);
  const [data, setData] = useState<TrackPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(value: string) {
    const t = value.trim();
    if (!t) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${API_URL}/admissions/applications/track/${encodeURIComponent(t)}/`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json?.detail === "string" ? json.detail : "Dossier introuvable.");
      }
      setData(json as TrackPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initial) void lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void lookup(token);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token de suivi"
          className="flex-1 rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white"
        >
          Vérifier
        </button>
      </form>
      {loading && <PageLoading />}
      {error && <ErrorState message={error} />}
      {data && (
        <dl className="space-y-3 rounded-xl bg-white p-5 text-sm shadow-soft">
          <Row label="Statut" value={data.status_label || data.status} />
          <Row label="Programme" value={data.program || "—"} />
          <Row label="E-mail" value={data.email} />
          <Row
            label="Soumis le"
            value={data.created_at ? new Date(data.created_at).toLocaleString() : "—"}
          />
          <Row
            label="Décision"
            value={data.reviewed_at ? new Date(data.reviewed_at).toLocaleString() : "En cours"}
          />
        </dl>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-iua-navy/10 pb-2">
      <dt className="text-iua-muted">{label}</dt>
      <dd className="font-medium text-iua-navy">{value}</dd>
    </div>
  );
}

export default function SuiviPage() {
  return (
    <PublicPage
      eyebrow="Admission"
      title="Suivi de candidature"
      lead="Entrez le token reçu à la soumission pour consulter le statut de votre dossier (sans compte)."
    >
      <Suspense fallback={<PageLoading />}>
        <SuiviForm />
      </Suspense>
    </PublicPage>
  );
}
