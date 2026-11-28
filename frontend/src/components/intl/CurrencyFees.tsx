"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatMultiCurrency } from "@/lib/intl/format";
import type { AppLocale } from "@/i18n/routing";

export function CurrencyFees({ amountXof, title }: { amountXof: number; title?: string }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("common");
  const amounts = formatMultiCurrency(amountXof, locale);

  return (
    <div className="rounded-xl border border-iua-navy/10 bg-white p-5 shadow-soft">
      {title && <p className="text-xs uppercase tracking-[0.16em] text-iua-cyan">{title}</p>}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <p className="font-display text-xl text-iua-navy">{amounts.xof}</p>
        <p className="text-sm text-iua-muted">{amounts.usd}</p>
        <p className="text-sm text-iua-muted">{amounts.eur}</p>
      </div>
      <p className="mt-3 text-xs text-iua-muted">{t("currencyNote")}</p>
    </div>
  );
}
