import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "office" });
  return buildPageMetadata({ locale: locale as AppLocale, title: t("title"), description: t("lead"), path: "/international/bureau" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("office");
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-soft text-sm text-iua-muted space-y-3">
          <p><a className="text-iua-blue" href={`mailto:${t("email")}`}>{t("email")}</a></p>
          <p><a className="text-iua-blue" href={`tel:${t("phone").replace(/\s/g, "")}`}>{t("phone")}</a></p>
          <p>{t("hours")}</p>
          <p>{t("address")}</p>
        </div>
        <a
          href="https://wa.me/2252722422265?text=Hello%20IUA%20International%20Office"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-[#25D366] px-6 py-8 text-center text-sm font-semibold text-white shadow-soft"
        >
          {t("whatsappCta")}
        </a>
      </div>
    </PublicPage>
  );
}
