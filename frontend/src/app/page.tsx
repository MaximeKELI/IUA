import Link from "next/link";
import { AuthHomeCta } from "@/components/AuthHomeCta";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const journeys = [
  {
    title: "Je candidate",
    body: "Dossier, pièces et suivi d'admission dans un parcours clair.",
    href: "/admissions",
    tone: "bg-iua-navy text-white",
  },
  {
    title: "Je me connecte",
    body: "Notes, cours, paiements et documents — un seul compte.",
    href: "/connexion",
    tone: "bg-iua-cyan text-iua-navy",
  },
  {
    title: "Je découvre",
    body: "Licences, masters et facultés adaptés à votre projet.",
    href: "/formations",
    tone: "bg-iua-sun text-iua-navy",
  },
];

const roles = [
  ["Étudiant", "Emploi du temps, notes, paiements, documents"],
  ["Enseignant", "Cours, évaluations, absences, communication"],
  ["Administration", "Inscriptions, dossiers, validations"],
  ["Direction", "Indicateurs réels et pilotage central"],
];

const ticker = [
  "Licences & Masters",
  "Digital Campus",
  "Admissions en ligne",
  "Identité unique",
  "Campus Abidjan",
  "Accompagnement pro",
];

export default function HomePage() {
  return (
    <main>
      <section className="relative min-h-[100svh] overflow-hidden text-white">
        {/* Native CSS background = sharp full-bleed photo (no Next optimizer downsample) */}
        <div
          className="absolute inset-0 bg-cover bg-[position:center_18%] bg-no-repeat"
          style={{ backgroundImage: "url('/brand/campus-hero.png')" }}
          role="img"
          aria-label="Étudiantes de l'Institut Universitaire d'Abidjan"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-iua-navy/78 via-iua-navy/50 to-iua-navy/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-iua-navy/65 via-transparent to-iua-navy/15" />

        <SiteHeader />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-16 pt-44 sm:justify-center sm:pb-24">
          <BrandLogo
            variant="white"
            priority
            className="mb-7 h-12 w-auto sm:h-14 animate-[fadeUp_0.5s_ease_both]"
          />
          <p className="mb-4 text-xs uppercase tracking-[0.28em] text-iua-cyan animate-[fadeUp_0.55s_ease_both]">
            One University · One Digital Ecosystem
          </p>
          <h1 className="max-w-2xl font-display text-4xl leading-[1.08] text-balance drop-shadow-sm sm:text-6xl animate-[fadeUp_0.65s_ease_both]">
            L&apos;excellence commence avec vous
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg animate-[fadeUp_0.75s_ease_both]">
            Un seul portail pour candidater, étudier, payer et suivre votre parcours à
            l&apos;Institut Universitaire d&apos;Abidjan.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 animate-[fadeUp_0.85s_ease_both]">
            <Link
              href="/admissions"
              prefetch
              className="btn-shine rounded-md bg-iua-sun px-6 py-3 text-sm font-semibold text-iua-navy transition hover:brightness-105"
            >
              S&apos;inscrire maintenant
            </Link>
            <AuthHomeCta className="rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20" />
          </div>
          <div className="mt-14 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-white/55 animate-[fadeUp_1s_ease_both]">
            <span className="inline-block h-px w-10 bg-iua-cyan/80" />
            Défilez pour explorer
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
              <p className="text-xs uppercase tracking-[0.2em] opacity-70">Parcours</p>
              <h2 className="mt-3 font-display text-2xl transition group-hover:translate-x-1">
                {item.title}
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed opacity-80">{item.body}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold transition group-hover:gap-3">
                Continuer <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 content-auto">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-iua-cyan">Digital Campus</p>
          <h2 className="mt-3 font-display text-3xl text-iua-navy sm:text-4xl">
            Des services clairement rangés, pas une liste confuse
          </h2>
          <p className="mt-4 text-iua-muted">
            Chaque intention a son chemin : découvrir, candidater, ou travailler dans le
            portail — avec une navigation adaptée à votre rôle.
          </p>
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
            <p className="text-xs uppercase tracking-[0.2em] text-iua-sun">Campus vivant</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              Une université moderne, une expérience numérique à la hauteur
            </h2>
            <p className="mt-4 max-w-xl text-white/70">
              Formation, vie de campus et services administratifs se rejoignent dans IUA
              Digital Campus — sans multiplier les comptes ni les déplacements.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/campus"
                className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-iua-navy transition hover:bg-iua-mist"
              >
                Découvrir le campus
              </Link>
              <Link
                href="/institution"
                className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                L&apos;institution
              </Link>
            </div>
          </div>
          <div
            className="relative h-72 overflow-hidden rounded-2xl bg-cover bg-[position:center_15%] shadow-soft sm:h-80"
            style={{ backgroundImage: "url('/brand/campus-hero.png')" }}
            role="img"
            aria-label="Étudiantes IUA"
          >
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-iua-navy/80 to-transparent p-5">
              <p className="text-sm font-medium">Excellence · Professionnalisme · Abidjan</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-iua-navy/10 bg-white content-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-iua-sun">Rentrée 2026-2027</p>
            <h2 className="mt-3 font-display text-3xl text-iua-navy">
              Les inscriptions sont ouvertes
            </h2>
            <p className="mt-3 text-iua-muted">
              Déposez votre candidature en ligne et suivez l&apos;avancement de votre dossier
              sans multiplier les guichets.
            </p>
          </div>
          <Link
            href="/admissions"
            className="btn-shine inline-flex rounded-md bg-iua-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-iua-blue"
          >
            Démarrer mon inscription
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
