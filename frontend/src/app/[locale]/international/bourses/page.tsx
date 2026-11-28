import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { Link } from "@/i18n/navigation";
import { CurrencyFees } from "@/components/intl/CurrencyFees";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "scholarships" });
  return buildPageMetadata({ locale: locale as AppLocale, title: t("title"), description: t("lead"), path: "/international/bourses" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("scholarships");
  const criteria = t.raw("criteria") as string[];
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <ul className="grid gap-3 md:grid-cols-2">
        {criteria.map((c) => (
          <li key={c} className="rounded-xl bg-white px-4 py-3 text-sm text-iua-navy shadow-soft">{c}</li>
        ))}
      </ul>
      <div className="mt-8">
        <CurrencyFees amountXof={0} title="Aide indicative (dossier)" />
      </div>
      <Link href="/admissions" className="mt-8 inline-flex rounded-md bg-iua-sun px-5 py-3 text-sm font-semibold text-iua-navy">{t("cta")}</Link>
    </PublicPage>
  );
}
