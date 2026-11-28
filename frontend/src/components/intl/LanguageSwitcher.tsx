"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type AppLocale } from "@/i18n/routing";

export function LanguageSwitcher({ solid = false }: { solid?: boolean }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("header");

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as AppLocale })}
        className={`appearance-none rounded-md border px-2.5 py-2 text-xs font-semibold tracking-wide ${
          solid
            ? "border-iua-navy/15 bg-white text-iua-navy"
            : "border-white/25 bg-white/10 text-white backdrop-blur-sm"
        }`}
        aria-label={t("language")}
      >
        {locales.map((code) => (
          <option key={code} value={code} className="text-iua-navy">
            {localeNames[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
