"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { EmptyState, ErrorState, PageLoading } from "@/components/ux";
import { Link } from "@/i18n/navigation";

type VerifyPayload = {
  valid: boolean;
  document_type?: string;
  locale?: string;
  issued_at?: string;
  student_number?: string;
  full_name?: string;
  program?: string | null;
  status?: string;
  institution?: string;
  detail?: string;
};

const DOC_LABELS: Record<string, string> = {
  attestation: "Attestation de scolarité",
  transcript: "Relevé de notes",
  admission_letter: "Lettre d'admission",
  equivalence: "Attestation d'équivalence",
};

export default function VerifyDocumentPage() {
  const tc = useTranslations("common");
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : Array.isArray(params.token) ? params.token.join("/") : "";
  const [data, setData] = useState<VerifyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Jeton manquant.");
      return;
    }
    const api = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/$/, "");
    setLoading(true);
    fetch(`${api}/documents/verify/${encodeURIComponent(token)}/`)
      .then(async (res) => {
        const json = (await res.json()) as VerifyPayload;
        if (!res.ok || !json.valid) {
          setError(json.detail || "Document non vérifiable.");
          setData(json);
          return;
        }
        setData(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <main className="min-h-[100svh] bg-iua-mist px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="inline-flex items-center gap-3">
          <BrandLogo className="h-10 w-auto" />
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.18em] text-iua-cyan">Vérification</p>
        <h1 className="mt-2 font-display text-3xl text-iua-navy">Authenticité du document</h1>
        <p className="mt-2 text-sm text-iua-muted">
          Contrôle en lecture seule d&apos;un document officiel IUA.
        </p>

        {loading && <PageLoading label={tc("loading")} />}
        {!loading && error && !data?.valid && (
          <div className="mt-8">
            <ErrorState message={error} />
          </div>
        )}
        {!loading && data?.valid && (
          <div className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold text-emerald-700">Document authentique</p>
            <dl className="space-y-3 text-sm">
              <Item label="Institution" value={data.institution || "IUA"} />
              <Item
                label="Type"
                value={DOC_LABELS[data.document_type || ""] || data.document_type || "—"}
              />
              <Item label="Étudiant" value={data.full_name || "—"} />
              <Item label="Matricule" value={data.student_number || "—"} />
              <Item label="Formation" value={data.program || "—"} />
              <Item label="Statut" value={data.status || "—"} />
              <Item
                label="Émis"
                value={
                  data.issued_at ? new Date(data.issued_at).toLocaleString() : "—"
                }
              />
            </dl>
          </div>
        )}
        {!loading && !error && !data && <EmptyState title={tc("empty")} />}
      </div>
    </main>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-iua-navy/10 pb-2">
      <dt className="text-iua-muted">{label}</dt>
      <dd className="text-end font-medium text-iua-navy">{value}</dd>
    </div>
  );
}
