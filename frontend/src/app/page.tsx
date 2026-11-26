"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal, Stagger, StaggerItem, motion } from "@/components/motion";

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
        <Image
          src="/brand/campus-hero.jpg"
          alt="Étudiantes de l'Institut Universitaire d'Abidjan"
          fill
          priority
          className="hero-kenburns object-cover object-[center_20%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-iua-navy/93 via-iua-navy/78 to-iua-navy/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-iua-navy/75 via-transparent to-iua-navy/30" />
        <div className="glow-orb pointer-events-none absolute -left-20 top-28 h-64 w-64 rounded-full bg-iua-cyan/25 blur-3xl" />
        <div className="glow-orb pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-iua-sun/20 blur-3xl [animation-delay:1.5s]" />

        <SiteHeader />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-16 pt-44 sm:justify-center sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src="/brand/logo-iua.png"
              alt="IUA"
              width={220}
              height={84}
              className="mb-8 h-14 w-auto brightness-0 invert sm:h-16"
              priority
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mb-4 text-xs uppercase tracking-[0.28em] text-iua-cyan"
          >
            One University · One Digital Ecosystem
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl font-display text-4xl leading-[1.08] text-balance sm:text-6xl"
          >
            L&apos;excellence commence avec vous
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg"
          >
            Un seul portail pour candidater, étudier, payer et suivre votre parcours à
            l&apos;Institut Universitaire d&apos;Abidjan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.65 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link
              href="/admissions"
              className="btn-shine rounded-md bg-iua-sun px-6 py-3 text-sm font-semibold text-iua-navy transition hover:brightness-105"
            >
              S&apos;inscrire maintenant
            </Link>
            <Link
              href="/connexion"
              className="rounded-md border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Accéder au Digital Campus
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-14 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-white/55"
          >
            <span className="inline-block h-px w-10 bg-iua-cyan/80" />
            Défilez pour explorer
          </motion.div>
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

      <section className="bg-white">
        <Stagger className="mx-auto grid max-w-6xl gap-0 md:grid-cols-3">
          {journeys.map((item) => (
            <StaggerItem key={item.title}>
              <Link
                href={item.href}
                className={`group block h-full px-8 py-12 transition duration-300 hover:-translate-y-1 hover:brightness-[1.04] ${item.tone}`}
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
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-iua-cyan">Digital Campus</p>
          <h2 className="mt-3 font-display text-3xl text-iua-navy sm:text-4xl">
            Des services clairement rangés, pas une liste confuse
          </h2>
          <p className="mt-4 text-iua-muted">
            Chaque intention a son chemin : découvrir, candidater, ou travailler dans le
            portail — avec une navigation adaptée à votre rôle.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map(([title, body]) => (
            <StaggerItem key={title}>
              <article className="group h-full border-t border-iua-navy/15 pt-5 transition hover:border-iua-cyan">
                <h3 className="font-display text-xl text-iua-navy transition group-hover:text-iua-blue">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-iua-muted">{body}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="relative overflow-hidden bg-iua-navy py-20 text-white">
        <div className="glow-orb pointer-events-none absolute -right-10 top-0 h-72 w-72 rounded-full bg-iua-cyan/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal>
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
          </Reveal>
          <Reveal variant="scale" delay={0.1}>
            <div className="float-soft relative overflow-hidden rounded-2xl shadow-soft">
              <Image
                src="/brand/campus-hero.jpg"
                alt="Étudiantes IUA"
                width={900}
                height={640}
                className="h-72 w-full object-cover object-top sm:h-80"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-iua-navy/80 to-transparent p-5">
                <p className="text-sm font-medium">Excellence · Professionnalisme · Abidjan</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-iua-navy/10 bg-white">
        <Reveal className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 md:flex-row md:items-end md:justify-between">
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
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
