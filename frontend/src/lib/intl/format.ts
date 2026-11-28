import type { AppLocale } from "@/i18n/routing";

const localeTag: Record<AppLocale, string> = {
  fr: "fr-CI",
  en: "en-GB",
  pt: "pt-PT",
  es: "es-ES",
  ar: "ar",
};

export function formatDate(value: string | Date, locale: AppLocale, options?: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(localeTag[locale], options ?? { dateStyle: "medium" }).format(date);
}

export function formatNumber(value: number, locale: AppLocale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(localeTag[locale], options).format(value);
}

export function formatCurrency(
  amountXof: number,
  locale: AppLocale,
  currency: "XOF" | "USD" | "EUR" = "XOF",
) {
  const rates = { XOF: 1, USD: 1 / 600, EUR: 1 / 655 };
  const converted = amountXof * rates[currency];
  return new Intl.NumberFormat(localeTag[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "XOF" ? 0 : 2,
  }).format(converted);
}

export function formatMultiCurrency(amountXof: number, locale: AppLocale) {
  return {
    xof: formatCurrency(amountXof, locale, "XOF"),
    usd: formatCurrency(amountXof, locale, "USD"),
    eur: formatCurrency(amountXof, locale, "EUR"),
  };
}
