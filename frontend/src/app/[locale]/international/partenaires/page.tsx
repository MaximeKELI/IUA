import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partners" });
  return buildPageMetadata({ locale: locale as AppLocale, title: t("title"), description: t("lead"), path: "/international/partenaires" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("partners");
  const items = t.raw("items") as { name: string; region: string; focus: string }[];
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.name} className="rounded-xl bg-white p-5 shadow-soft">
            <p className="text-xs uppercase tracking-[0.16em] text-iua-cyan">{item.region}</p>
            <h2 className="mt-2 font-display text-xl text-iua-navy">{item.name}</h2>
            <p className="mt-2 text-sm text-iua-muted">{item.focus}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-dashed border-iua-navy/20 bg-iua-mist p-6 text-sm text-iua-muted">
        {t("mapNote")}
      </div>
    </PublicPage>
  );
}
