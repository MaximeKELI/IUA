import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "visa" });
  return buildPageMetadata({ locale: locale as AppLocale, title: t("title"), description: t("lead"), path: "/international/visa" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("visa");
  const steps = t.raw("steps") as { t: string; b: string }[];
  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <ol className="grid gap-4 md:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.t} className="rounded-xl bg-white p-5 shadow-soft">
            <p className="font-mono text-sm text-iua-cyan">{String(i + 1).padStart(2, "0")}</p>
            <h2 className="mt-2 font-display text-xl text-iua-navy">{s.t}</h2>
            <p className="mt-2 text-sm text-iua-muted">{s.b}</p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-iua-muted">{t("note")}</p>
      <Link href="/international/bureau" className="mt-6 inline-flex rounded-md bg-iua-navy px-5 py-3 text-sm font-semibold text-white">Bureau RI</Link>
    </PublicPage>
  );
}
