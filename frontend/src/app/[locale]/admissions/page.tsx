import { getTranslations, setRequestLocale } from "next-intl/server";
import { CurrencyFees } from "@/components/intl/CurrencyFees";
import { InternationalApplicationForm } from "@/components/intl/InternationalApplicationForm";
import { PublicPage } from "@/components/PublicPage";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admissions" });
  return buildPageMetadata({
    locale: locale as AppLocale,
    title: t("title"),
    description: t("lead"),
    path: "/admissions",
  });
}

export default async function AdmissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admissions");

  const steps = [
    { n: "01", title: t("s1"), body: t("s1b") },
    { n: "02", title: t("s2"), body: t("s2b") },
    { n: "03", title: t("s3"), body: t("s3b") },
    { n: "04", title: t("s4"), body: t("s4b") },
  ];

  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <ol className="grid gap-6 md:grid-cols-2">
        {steps.map((step) => (
          <li key={step.n} className="rounded-xl bg-white p-6 shadow-soft">
            <p className="font-mono text-sm text-iua-cyan">{step.n}</p>
            <h2 className="mt-2 font-display text-2xl text-iua-navy">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-iua-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/formations"
          className="rounded-md bg-iua-navy px-5 py-3 text-sm font-semibold text-white"
        >
          {t("seePrograms")}
        </Link>
        <Link
          href="/connexion"
          className="rounded-md border border-iua-navy/15 bg-white px-5 py-3 text-sm font-semibold text-iua-navy"
        >
          {t("haveAccount")}
        </Link>
        <Link
          href="/international"
          className="rounded-md border border-iua-cyan/40 bg-iua-cyan/10 px-5 py-3 text-sm font-semibold text-iua-navy"
        >
          International
        </Link>
      </div>

      <section className="mt-14 space-y-6">
        <div>
          <h2 className="font-display text-3xl text-iua-navy">{t("intlTitle")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-iua-muted">{t("intlLead")}</p>
        </div>
        <CurrencyFees amountXof={t.raw("feesAmount") as number} title={t("feesTitle")} />
        <InternationalApplicationForm />
        <p className="text-sm text-iua-muted">{t("note")}</p>
      </section>
    </PublicPage>
  );
}
