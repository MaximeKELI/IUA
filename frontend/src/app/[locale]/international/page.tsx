import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicPage } from "@/components/PublicPage";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "international" });
  return buildPageMetadata({
    locale: locale as AppLocale,
    title: t("title"),
    description: t("lead"),
    path: "/international",
  });
}

export default async function InternationalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("international");
  const tt = await getTranslations("testimonials");
  const tc = await getTranslations("calendar");
  const tp = await getTranslations("payments");
  const testimonials = tt.raw("items") as { name: string; country: string; quote: string }[];
  const calendar = tc.raw("items") as { when: string; what: string }[];
  const methods = tp.raw("methods") as string[];

  const hubs = [
    { href: "/international/visa", title: t("hubVisa"), body: t("hubVisaBody") },
    { href: "/international/equivalences", title: t("hubEquiv"), body: t("hubEquivBody") },
    { href: "/international/ects", title: t("hubEcts"), body: t("hubEctsBody") },
    { href: "/international/partenaires", title: t("hubPartners"), body: t("hubPartnersBody") },
    { href: "/international/faq", title: t("hubFaq"), body: t("hubFaqBody") },
    { href: "/international/arrivee", title: t("hubArrival"), body: t("hubArrivalBody") },
    { href: "/international/bureau", title: t("hubOffice"), body: t("hubOfficeBody") },
    { href: "/international/bourses", title: t("hubScholar"), body: t("hubScholarBody") },
    { href: "/international/guides", title: t("hubGuides"), body: t("hubGuidesBody") },
    { href: "/international/legal", title: t("hubLegal"), body: t("hubLegalBody") },
    { href: "/international/alumni", title: t("hubAlumni"), body: t("hubAlumniBody") },
    { href: "/admissions", title: t("admitTitle"), body: t("admitBody") },
  ];

  return (
    <PublicPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hubs.map((item) => (
          <Link
            key={item.href + item.title}
            href={item.href}
            className="group rounded-xl bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="font-display text-xl text-iua-navy group-hover:text-iua-blue">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-iua-muted">{item.body}</p>
          </Link>
        ))}
      </div>

      <section className="mt-14">
        <p className="text-xs uppercase tracking-[0.2em] text-iua-cyan">{tt("eyebrow")}</p>
        <h2 className="mt-2 font-display text-3xl text-iua-navy">{tt("title")}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="rounded-xl bg-white p-5 shadow-soft">
              <p className="text-sm leading-relaxed text-iua-muted">“{item.quote}”</p>
              <footer className="mt-4 text-sm font-semibold text-iua-navy">
                {item.name} · {item.country}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-iua-navy p-6 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-iua-sun">{tc("eyebrow")}</p>
          <h2 className="mt-2 font-display text-2xl">{tc("title")}</h2>
          <p className="mt-2 text-sm text-white/70">{tc("lead")}</p>
          <ul className="mt-5 space-y-3">
            {calendar.map((row) => (
              <li key={row.when} className="flex justify-between gap-4 border-t border-white/10 pt-3 text-sm">
                <span className="text-iua-cyan">{row.when}</span>
                <span className="text-end text-white/85">{row.what}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">{tp("title")}</p>
          <p className="mt-2 text-sm text-iua-muted">{tp("lead")}</p>
          <ul className="mt-5 space-y-2">
            {methods.map((m) => (
              <li key={m} className="rounded-md bg-iua-mist px-3 py-2 text-sm text-iua-navy">
                {m}
              </li>
            ))}
          </ul>
          <Link
            href="/admissions"
            className="mt-6 inline-flex rounded-md bg-iua-sun px-5 py-3 text-sm font-semibold text-iua-navy"
          >
            {t("admitTitle")}
          </Link>
        </div>
      </section>
    </PublicPage>
  );
}
