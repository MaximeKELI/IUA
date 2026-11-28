import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "arrival" });
  return buildPageMetadata({ locale: locale as AppLocale, title: t("title"), description: t("lead"), path: "/international/arrivee" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("arrival");
  const items = t.raw("items") as string[];
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={item} className="flex gap-4 rounded-xl bg-white p-4 shadow-soft">
            <span className="font-mono text-iua-cyan">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-sm text-iua-navy">{item}</span>
          </li>
        ))}
      </ol>
      <Link href="/international/guides" className="mt-8 inline-flex rounded-md bg-iua-navy px-5 py-3 text-sm font-semibold text-white">Guides PDF</Link>
    </PublicPage>
  );
}
