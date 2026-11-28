import { defineRouting } from "next-intl/routing";

export const locales = ["fr", "en", "pt", "es", "ar"] as const;
export type AppLocale = (typeof locales)[number];

export const localeNames: Record<AppLocale, string> = {
  fr: "Français",
  en: "English",
  pt: "Português",
  es: "Español",
  ar: "العربية",
};

export const rtlLocales: AppLocale[] = ["ar"];

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale: "fr",
  localePrefix: "always",
});
