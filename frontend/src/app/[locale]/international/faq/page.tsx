import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  return buildPageMetadata({ locale: locale as AppLocale, title: t("title"), description: t("title"), path: "/international/faq" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")}>
      <div className="space-y-4">
        {items.map((item) => (
          <details key={item.q} className="rounded-xl bg-white p-5 shadow-soft">
            <summary className="cursor-pointer font-display text-lg text-iua-navy">{item.q}</summary>
            <p className="mt-3 text-sm leading-relaxed text-iua-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </PublicPage>
  );
}
