"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { getAccessToken } from "@/lib/auth";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/$/, "");

type DocKind = "attestation" | "transcript" | "admission" | "equivalence";
type DocTitleKey = "docAttestation" | "docTranscript" | "docAdmission" | "docEquivalence";

const DOCS: { id: string; kind: DocKind; titleKey: DocTitleKey }[] = [
  { id: "certificate", kind: "attestation", titleKey: "docAttestation" },
  { id: "transcript", kind: "transcript", titleKey: "docTranscript" },
  { id: "admission", kind: "admission", titleKey: "docAdmission" },
  { id: "equivalence", kind: "equivalence", titleKey: "docEquivalence" },
];

const PATHS: Record<DocKind, string> = {
  attestation: "/documents/attestation/",
  transcript: "/documents/transcript/",
  admission: "/documents/admission-letter/",
  equivalence: "/documents/equivalence/",
};

export default function StudentDocumentsPage() {
  const tPortal = useTranslations("portal");
  const t = useTranslations("portal.student");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { ready } = useAuthToken();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function download(kind: DocKind, lang: "fr" | "en") {
    if (!ready) return;
    const token = getAccessToken();
    const key = `${kind}-${lang}`;
    setBusy(key);
    setError(null);
    try {
      const headers: Record<string, string> = { Accept: "application/pdf" };
      if (token && token !== "cookie") headers.Authorization = `Bearer ${token}`;
      const csrf =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )iua_csrf=([^;]*)/)?.[1]
          : null;
      if (csrf) headers["X-IUA-CSRF"] = decodeURIComponent(csrf);
      const res = await fetch(`${API_URL}${PATHS[kind]}?lang=${lang}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-${lang}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{t("docsBilingual")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">{t("docsLead")}</p>
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {DOCS.map((doc) => (
          <article key={doc.id} className="rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">{t(doc.titleKey)}</h2>
            <p className="mt-1 text-sm text-iua-muted">{locale.toUpperCase()}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["fr", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  disabled={!!busy}
                  onClick={() => void download(doc.kind, lang)}
                  className="rounded-md bg-iua-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {busy === `${doc.kind}-${lang}` ? "…" : `PDF ${lang.toUpperCase()}`}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
