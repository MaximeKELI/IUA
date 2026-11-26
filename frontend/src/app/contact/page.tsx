import { PublicPage } from "@/components/PublicPage";

export default function ContactPage() {
  return (
    <PublicPage
      eyebrow="Contact"
      title="Nous écrire"
      lead="Une seule page contact — les démarches administratives passent ensuite par le portail."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Coordonnées</h2>
          <ul className="mt-4 space-y-3 text-sm text-iua-muted">
            <li>II Plateaux, 7ème Tranche, Rue L40, Carrefour Cascades</li>
            <li>
              <a className="text-iua-blue" href="mailto:info@iua-ci.org">
                info@iua-ci.org
              </a>
            </li>
            <li>
              <a className="text-iua-blue" href="tel:+2252722422265">
                +225 27 224 222 65
              </a>
            </li>
            <li>
              <a className="text-iua-blue" href="tel:+2250707231862">
                +225 07 07 23 18 62
              </a>
            </li>
          </ul>
        </div>
        <div className="rounded-xl bg-iua-navy p-6 text-white">
          <h2 className="font-display text-xl">Besoin d&apos;un service étudiant ?</h2>
          <p className="mt-3 text-sm text-white/70">
            Attestations, notes, paiements et demandes se gèrent dans le Digital Campus après
            connexion — plus rapide qu&apos;un formulaire générique.
          </p>
        </div>
      </div>
    </PublicPage>
  );
}
