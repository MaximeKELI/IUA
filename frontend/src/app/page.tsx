import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <main>
      <section className="relative min-h-[100svh] overflow-hidden bg-hero-mesh text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <SiteHeader />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-20 pt-36 sm:justify-center sm:pb-24">
          <p className="mb-5 text-xs uppercase tracking-[0.28em] text-iua-gold animate-[fadeUp_0.8s_ease_both]">
            One University · One Digital Ecosystem
          </p>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.05] text-balance sm:text-6xl animate-[fadeUp_0.9s_ease_both]">
            IUA Digital Campus
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg animate-[fadeUp_1s_ease_both]">
            L&apos;environnement numérique unique de l&apos;Institut Universitaire d&apos;Abidjan —
            études, administration, pédagogie et vie de campus, interconnectés.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 animate-[fadeUp_1.1s_ease_both]">
            <Link
              href="/connexion"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-iua-navy transition hover:bg-iua-sand"
            >
              Accéder au portail
            </Link>
            <Link
              href="/admissions"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Candidater
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-3xl text-iua-navy">Un SIU, pas un site vitrine</h2>
        <p className="mt-4 max-w-2xl text-iua-ink/70">
          Trente modules métier partagent les mêmes identités, référentiels et événements.
          Étudiants, enseignants et direction travaillent dans un seul écosystème.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            {
              title: "Identité unique",
              body: "Une connexion pour tous les services universitaires autorisés.",
            },
            {
              title: "Processus automatisés",
              body: "Admissions, paiements, notes et documents reliés par événements métier.",
            },
            {
              title: "Pilotage fiable",
              body: "Indicateurs calculés sur les données réelles de l'établissement.",
            },
          ].map((item) => (
            <article key={item.title} className="border-t border-iua-navy/15 pt-6">
              <h3 className="font-display text-xl text-iua-navy">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-iua-ink/65">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
