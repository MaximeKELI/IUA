import Link from "next/link";

export default function AdmissionsPage() {
  return (
    <main className="min-h-[100svh] bg-iua-sand px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-iua-navy/60 hover:text-iua-navy">
          ← Accueil
        </Link>
        <h1 className="mt-8 font-display text-4xl text-iua-navy">Admissions</h1>
        <p className="mt-4 text-iua-ink/70">
          Le module 03 (Admissions & Inscriptions) est planifié en Vague A après le socle.
          Cette page accueillera le parcours candidature, dépôt de pièces et suivi de dossier.
        </p>
        <Link
          href="/connexion"
          className="mt-10 inline-flex rounded-full bg-iua-navy px-6 py-3 text-sm font-semibold text-white"
        >
          Accéder au portail
        </Link>
      </div>
    </main>
  );
}
