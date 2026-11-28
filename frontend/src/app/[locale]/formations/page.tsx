import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

const programs = [
  {
    level: "Licence / Bachelor",
    name: "Licence en Gestion · Business Administration",
    faculty: "Faculté des Sciences Économiques et de Gestion",
    keywords: "Business · Finance · Management",
  },
  {
    level: "Licence / Bachelor",
    name: "Licence en Informatique · Computer Science / IT",
    faculty: "Faculté des Sciences et Technologies",
    keywords: "Software · Networks · Data",
  },
  {
    level: "Master / MSc",
    name: "Master en Management · MBA pathway",
    faculty: "Faculté des Sciences Économiques et de Gestion",
    keywords: "MBA · Leadership · Strategy",
  },
  {
    level: "Master / MSc",
    name: "Droit & Relations internationales · Law / IR",
    faculty: "Faculté de Droit",
    keywords: "Law · International Relations",
  },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "programs" });
  return buildPageMetadata({
    locale: locale as AppLocale,
    title: t("title"),
    description: t("lead"),
    path: "/formations",
  });
}

export default async function FormationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("programs");
  const tc = await getTranslations("common");

  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <p className="mb-8 text-sm text-iua-cyan">{t("seoKeywords")}</p>
      <div className="space-y-4">
        {programs.map((p) => (
          <article
            key={p.name}
            className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-iua-cyan">{p.level}</p>
              <h2 className="mt-1 font-display text-2xl text-iua-navy">{p.name}</h2>
              <p className="mt-1 text-sm text-iua-muted">{p.faculty}</p>
              <p className="mt-2 text-xs text-iua-muted">{p.keywords}</p>
            </div>
            <Link
              href="/admissions"
              className="inline-flex rounded-md bg-iua-sun px-4 py-2.5 text-sm font-semibold text-iua-navy"
            >
              {tc("apply")}
            </Link>
          </article>
        ))}
      </div>
    </PublicPage>
  );
}
