import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "alumni" });
  return buildPageMetadata({ locale: locale as AppLocale, title: t("title"), description: t("lead"), path: "/international/alumni" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("alumni");
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <a
        href="https://www.linkedin.com/school/institut-universitaire-d-abidjan/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex rounded-md bg-[#0A66C2] px-6 py-3 text-sm font-semibold text-white"
      >
        {t("cta")}
      </a>
    </PublicPage>
  );
}
