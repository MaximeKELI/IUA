import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return buildPageMetadata({
    locale: locale as AppLocale,
    title: t("title"),
    description: t("lead"),
    path: "/contact",
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const o = await getTranslations("office");
  const f = await getTranslations("footer");

  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">{t("eyebrow")}</h2>
          <ul className="mt-4 space-y-3 text-sm text-iua-muted">
            <li>{f("address")}</li>
            <li>
              <a className="text-iua-blue" href="mailto:info@iua-ci.org">
                info@iua-ci.org
              </a>
            </li>
            <li>
              <a className="text-iua-blue" href="mailto:international@iua-ci.org">
                international@iua-ci.org
              </a>
            </li>
            <li>
              <a className="text-iua-blue" href="tel:+2252722422265">
                +225 27 224 222 65
              </a>
            </li>
            <li>{o("hours")}</li>
          </ul>
        </div>
        <div className="rounded-xl bg-iua-navy p-6 text-white">
          <h2 className="font-display text-xl">{o("title")}</h2>
          <p className="mt-3 text-sm text-white/70">{o("lead")}</p>
          <a
            href="https://wa.me/2252722422265?text=Hello%20IUA%20International"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-md bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {o("whatsappCta")}
          </a>
        </div>
      </div>
    </PublicPage>
  );
}
