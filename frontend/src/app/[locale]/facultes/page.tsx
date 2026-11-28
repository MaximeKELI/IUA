import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faculties" });
  return buildPageMetadata({
    locale: locale as AppLocale,
    title: t("title"),
    description: t("lead"),
    path: "/facultes",
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faculties");
  const n = await getTranslations("nav");
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <div className="flex flex-wrap gap-3">
        <Link href="/international" className="rounded-md bg-iua-navy px-5 py-3 text-sm font-semibold text-white">
          {n("international")}
        </Link>
        <Link href="/admissions" className="rounded-md bg-iua-sun px-5 py-3 text-sm font-semibold text-iua-navy">
          {n("admissions")}
        </Link>
        <Link href="/formations" className="rounded-md border border-iua-navy/15 bg-white px-5 py-3 text-sm font-semibold text-iua-navy">
          {n("programs")}
        </Link>
      </div>
    </PublicPage>
  );
}
