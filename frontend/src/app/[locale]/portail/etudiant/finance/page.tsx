"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { formatMultiCurrency } from "@/lib/intl/format";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

type Payment = { id: string; label: string; amount_xof: number; due_date: string | null; status: string; method: string; reference: string };
const statusLabel: Record<string,string> = { due: "À payer", paid: "Payé", partial: "Partiel", overdue: "En retard" };

export default function FinancePage() {
  const tPortal = useTranslations("portal");

  const locale = useLocale() as AppLocale;
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Page<Payment>>("/student/payments/?page_size=50", token).then((d) => setItems(unwrapList(d))).catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [ready, token]);
  const due = items.filter((p) => p.status !== "paid").reduce((a, p) => a + p.amount_xof, 0);
  const amounts = formatMultiCurrency(due, locale);
  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.finance")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Échéances, soldes et historique — montants aussi en USD/EUR.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-6 rounded-xl bg-iua-navy p-5 text-white">
        <p className="text-xs uppercase tracking-[0.14em] text-white/60">Reste à payer</p>
        <p className="mt-2 font-display text-3xl">{amounts.xof}</p>
        <p className="mt-1 text-sm text-white/70">{amounts.usd} · {amounts.eur}</p>
        <p className="mt-3 text-xs text-white/50">Mobile Money · Carte · Wise (bientôt branchés module Finance)</p>
      </div>
      <ul className="mt-8 space-y-3">
        {items.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-5 shadow-soft">
            <div>
              <p className="font-semibold text-iua-navy">{p.label}</p>
              <p className="text-xs text-iua-muted">{p.due_date || "—"} · {p.method || "—"} {p.reference ? `· ${p.reference}` : ""}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl text-iua-navy">{p.amount_xof.toLocaleString("fr-FR")} XOF</p>
              <p className="text-xs uppercase text-iua-muted">{statusLabel[p.status] || p.status}</p>
            </div>
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
