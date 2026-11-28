import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ects" });
  return buildPageMetadata({ locale: locale as AppLocale, title: t("title"), description: t("lead"), path: "/international/ects" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ects");
  const rows = t.raw("rows") as { iua: string; ects: string }[];
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <article key={r.iua} className="rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">{r.iua}</h2>
            <p className="mt-2 text-lg text-iua-cyan">{r.ects}</p>
          </article>
        ))}
      </div>
      <p className="mt-8 text-sm text-iua-muted">{t("note")}</p>
    </PublicPage>
  );
}
