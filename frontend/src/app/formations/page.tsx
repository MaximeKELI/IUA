import Link from "next/link";

export default function FormationsPage() {
  return (
    <main className="min-h-[100svh] bg-iua-sand px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-iua-navy/60 hover:text-iua-navy">
          ← Accueil
        </Link>
        <h1 className="mt-8 font-display text-4xl text-iua-navy">Catalogue des formations</h1>
        <p className="mt-4 text-iua-ink/70">
          Les formations sont servies par l&apos;API académique (`/api/v1/programs/`).
          Le catalogue public dynamique sera branché dès l&apos;ouverture anonyme contrôlée
          des référentiels.
        </p>
        <article className="mt-10 border-t border-iua-navy/15 pt-6">
          <p className="text-xs uppercase tracking-[0.16em] text-iua-teal">Licence</p>
          <h2 className="mt-2 font-display text-2xl text-iua-navy">Licence en Gestion</h2>
          <p className="mt-3 text-sm text-iua-ink/65">
            Formation initiale — Faculté des Sciences Économiques et de Gestion (données démo).
          </p>
        </article>
      </div>
    </main>
  );
}
