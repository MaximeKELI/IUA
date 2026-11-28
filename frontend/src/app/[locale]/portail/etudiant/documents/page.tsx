"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PortalShell } from "@/components/PortalShell";
import { getAccessToken } from "@/lib/auth";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/$/, "");

type DocKind = "attestation" | "transcript";

const docs: {
  id: string;
  fr: string;
  en: string;
  kind?: DocKind;
}[] = [
  {
    id: "certificate",
    fr: "Attestation de scolarité",
    en: "Enrollment certificate",
    kind: "attestation",
  },
  { id: "transcript", fr: "Relevé de notes", en: "Academic transcript", kind: "transcript" },
  { id: "admission", fr: "Lettre d'admission", en: "Admission letter" },
  { id: "equivalence", fr: "Attestation d'équivalence", en: "Equivalence statement" },
];

export default function StudentDocumentsPage() {
  const t = useTranslations("portal.student");
  const { ready } = useAuthToken();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function download(kind: DocKind, lang: "fr" | "en") {
    if (!ready) return;
    const token = getAccessToken();
    if (!token) {
      setError("Session expirée.");
      return;
    }
    const key = `${kind}-${lang}`;
    setBusy(key);
    setError(null);
    try {
      const path =
        kind === "transcript"
          ? `/documents/transcript/?lang=${lang}`
          : `/documents/attestation/?lang=${lang}`;
      const res = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" },
      });
      if (!res.ok) throw new Error(`Échec téléchargement (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-${lang}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setBusy(null);
    }
  }

  return (
    <PortalShell title="Étudiant" nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{t("docsBilingual")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">{t("docsLead")}</p>
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {docs.map((doc) => (
          <article key={doc.id} className="rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">{doc.fr}</h2>
            <p className="mt-1 text-sm text-iua-muted">{doc.en}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {doc.kind ? (
                <>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => void download(doc.kind!, "fr")}
                    className="rounded-md bg-iua-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {busy === `${doc.kind}-fr` ? "…" : "PDF FR"}
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => void download(doc.kind!, "en")}
                    className="rounded-md border border-iua-navy/15 px-3 py-2 text-xs font-semibold text-iua-navy disabled:opacity-60"
                  >
                    {busy === `${doc.kind}-en` ? "…" : "PDF EN"}
                  </button>
                </>
              ) : (
                <span className="text-xs text-iua-muted">
                  Bientôt — ouvrez une demande administrative.
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
