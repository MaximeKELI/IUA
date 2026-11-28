import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "equivalences" });
  return buildPageMetadata({ locale: locale as AppLocale, title: t("title"), description: t("lead"), path: "/international/equivalences" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("equivalences");
  const rows = t.raw("rows") as { from: string; to: string }[];
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <div className="overflow-hidden rounded-xl bg-white shadow-soft">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.from} className="border-b border-iua-navy/10">
                <td className="px-5 py-4 text-iua-navy">{r.from}</td>
                <td className="px-5 py-4 text-iua-muted">{r.to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/admissions" className="mt-8 inline-flex rounded-md bg-iua-sun px-5 py-3 text-sm font-semibold text-iua-navy">{t("cta")}</Link>
    </PublicPage>
  );
}
