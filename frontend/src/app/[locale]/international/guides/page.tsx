import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });
  return buildPageMetadata({ locale: locale as AppLocale, title: t("title"), description: t("lead"), path: "/international/guides" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guides");
  const items = t.raw("items") as { t: string; b?: string }[];
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.t}
            href="/guides/iua-international-welcome.pdf"
            className="rounded-xl bg-white p-5 shadow-soft transition hover:-translate-y-0.5"
          >
            <h2 className="font-display text-xl text-iua-navy">{item.t}</h2>
            <p className="mt-2 text-sm text-iua-muted">{item.b || ""}</p>
          </a>
        ))}
      </div>
    </PublicPage>
  );
}
