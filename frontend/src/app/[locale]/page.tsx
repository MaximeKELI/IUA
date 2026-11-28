import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthHomeCta } from "@/components/AuthHomeCta";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/intl/seo";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return buildPageMetadata({
    locale: locale as AppLocale,
    title: t("title"),
    description: t("lead"),
    path: "/",
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const ticker = t.raw("ticker") as string[];

  const journeys = [
    { title: t("j1Title"), body: t("j1Body"), href: "/admissions", tone: "bg-iua-navy text-white" },
    { title: t("j2Title"), body: t("j2Body"), href: "/connexion", tone: "bg-iua-cyan text-iua-navy" },
    { title: t("j3Title"), body: t("j3Body"), href: "/formations", tone: "bg-iua-sun text-iua-navy" },
  ];

  const roles = [
    [t("roleStudent"), t("roleStudentBody")],
    [t("roleTeacher"), t("roleTeacherBody")],
    [t("roleAdmin"), t("roleAdminBody")],
    [t("roleDirection"), t("roleDirectionBody")],
  ];

  return (
    <main>
      <section className="relative min-h-[100svh] overflow-hidden text-white">
        <div
          className="absolute inset-0 bg-cover bg-[position:center_18%] bg-no-repeat"
          style={{ backgroundImage: "url('/brand/campus-hero.png')" }}
          role="img"
          aria-label={t("ariaHero")}
        />
        {/* Stronger overlays for WCAG contrast on hero text */}
        <div className="absolute inset-0 bg-gradient-to-r from-iua-navy/88 via-iua-navy/62 to-iua-navy/28" />
        <div className="absolute inset-0 bg-gradient-to-t from-iua-navy/75 via-iua-navy/20 to-iua-navy/25" />
        <div className="absolute inset-y-0 start-0 w-full max-w-3xl bg-gradient-to-r from-iua-navy/55 to-transparent" />

        <SiteHeader />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-16 pt-44 sm:justify-center sm:pb-24">
          <BrandLogo
            variant="white"
            priority
            className="mb-7 h-12 w-auto sm:h-14 animate-[fadeUp_0.5s_ease_both]"
          />
          <p className="mb-4 text-xs uppercase tracking-[0.28em] text-iua-cyan animate-[fadeUp_0.55s_ease_both]">
            {t("brand")}
          </p>
          <h1 className="max-w-2xl font-display text-4xl leading-[1.08] text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-6xl animate-[fadeUp_0.65s_ease_both]">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg animate-[fadeUp_0.75s_ease_both]">
            {t("lead")}
          </p>
          <div className="mt-9 flex flex-wrap gap-3 animate-[fadeUp_0.85s_ease_both]">
            <Link
              href="/admissions"
              prefetch
              className="btn-shine rounded-md bg-iua-sun px-6 py-3 text-sm font-semibold text-iua-navy transition hover:brightness-105"
            >
              {t("ctaApply")}
            </Link>
            <AuthHomeCta className="rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20" />
            <Link
              href="/international"
              className="rounded-md border border-iua-cyan/50 bg-iua-cyan/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-iua-cyan/25"
            >
              {t("intlBanner")} → {t("intlBannerCta")}
            </Link>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-iua-navy/10 bg-iua-navy py-3 text-white">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap px-6 text-xs uppercase tracking-[0.22em] text-white/70">
          {[...ticker, ...ticker].map((item, i) => (
            <span key={`${item}-${i}`} className="inline-flex items-center gap-10">
              {item}
              <span className="text-iua-cyan">✦</span>
            </span>
          ))}
        </div>
      </div>

      <section className="bg-white content-auto">
        <div className="mx-auto grid max-w-6xl gap-0 md:grid-cols-3">
          {journeys.map((item, index) => (
            <Link
              key={item.title}
              href={item.href}
              prefetch
              className={`group block h-full px-8 py-12 transition duration-300 hover:-translate-y-1 hover:brightness-[1.04] animate-[fadeUp_0.6s_ease_both] ${item.tone}`}
              style={{ animationDelay: `${0.05 * index}s` }}
            >
              <p className="text-xs uppercase tracking-[0.2em] opacity-70">{t("journeyLabel")}</p>
              <h2 className="mt-3 font-display text-2xl transition group-hover:translate-x-1">
                {item.title}
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed opacity-80">{item.body}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold transition group-hover:gap-3">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 content-auto">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-iua-cyan">{t("portalEyebrow")}</p>
          <h2 className="mt-3 font-display text-3xl text-iua-navy sm:text-4xl">{t("portalTitle")}</h2>
          <p className="mt-4 text-iua-muted">{t("portalLead")}</p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map(([title, body]) => (
            <article
              key={title}
              className="group h-full border-t border-iua-navy/15 pt-5 transition hover:border-iua-cyan"
            >
              <h3 className="font-display text-xl text-iua-navy transition group-hover:text-iua-blue">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-iua-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-iua-navy py-20 text-white content-auto">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-iua-sun">{t("campusEyebrow")}</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">{t("campusTitle")}</h2>
            <p className="mt-4 max-w-xl text-white/70">{t("campusLead")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/campus"
                className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-iua-navy transition hover:bg-iua-mist"
              >
                {t("discoverCampus")}
              </Link>
              <Link
                href="/institution"
                className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t("theInstitution")}
              </Link>
            </div>
          </div>
          <div
            className="relative h-72 overflow-hidden rounded-2xl bg-cover bg-[position:center_15%] shadow-soft sm:h-80"
            style={{ backgroundImage: "url('/brand/campus-hero.png')" }}
            role="img"
            aria-label={t("ariaHero")}
          >
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-iua-navy/85 to-transparent p-5">
              <p className="text-sm font-medium">{t("campusPlace")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-iua-navy/10 bg-white content-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-iua-sun">{t("intakeEyebrow")}</p>
            <h2 className="mt-3 font-display text-3xl text-iua-navy">{t("intakeTitle")}</h2>
            <p className="mt-3 text-iua-muted">{t("intakeLead")}</p>
          </div>
          <Link
            href="/admissions"
            className="btn-shine inline-flex rounded-md bg-iua-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-iua-blue"
          >
            {t("startApply")}
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
