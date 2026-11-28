"use client";

import { useTranslations } from "next-intl";
import { PortalShell } from "@/components/PortalShell";
import { studentNav } from "@/lib/navigation";

const docs = [
  { id: "transcript", fr: "Relevé de notes", en: "Academic transcript" },
  { id: "certificate", fr: "Attestation de scolarité", en: "Enrollment certificate" },
  { id: "admission", fr: "Lettre d'admission", en: "Admission letter" },
  { id: "equivalence", fr: "Attestation d'équivalence", en: "Equivalence statement" },
];

export default function StudentDocumentsPage() {
  const t = useTranslations("portal.student");

  return (
    <PortalShell title="Étudiant" nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{t("docsBilingual")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">{t("docsLead")}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {docs.map((doc) => (
          <article key={doc.id} className="rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">{doc.fr}</h2>
            <p className="mt-1 text-sm text-iua-muted">{doc.en}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-iua-navy px-3 py-2 text-xs font-semibold text-white"
              >
                PDF FR
              </button>
              <button
                type="button"
                className="rounded-md border border-iua-navy/15 px-3 py-2 text-xs font-semibold text-iua-navy"
              >
                PDF EN
              </button>
            </div>
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
