import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function buildLocaleAlternates(path: string): Metadata["alternates"] {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, `${siteUrl}/${locale}${normalized === "/" ? "" : normalized}`]),
  );
  return {
    canonical: `${siteUrl}/fr${normalized === "/" ? "" : normalized}`,
    languages: {
      ...languages,
      "x-default": `${siteUrl}/fr${normalized === "/" ? "" : normalized}`,
    },
  };
}

export function buildPageMetadata({
  locale,
  title,
  description,
  path,
}: {
  locale: AppLocale;
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: buildLocaleAlternates(path),
    openGraph: {
      title,
      description,
      locale,
      type: "website",
      url: `${siteUrl}/${locale}${path === "/" ? "" : path}`,
    },
  };
}
