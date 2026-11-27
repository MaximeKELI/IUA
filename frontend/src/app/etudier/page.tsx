import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";

export default function EtudierPage() {
  return (
    <PublicPage
      eyebrow="Étudier à l'IUA"
      title="Choisissez votre porte d'entrée"
      lead="Formations, admissions ou accueil international : choisissez votre entrée."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Formations", "Comparer licences et masters", "/formations"],
          ["Admissions", "Démarrer une candidature", "/admissions"],
          ["International", "Accueil des étudiants étrangers", "/international"],
        ].map(([title, body, href]) => (
          <Link
            key={title}
            href={href}
            className="rounded-xl bg-white p-6 shadow-soft transition hover:-translate-y-0.5"
          >
            <h2 className="font-display text-2xl text-iua-navy">{title}</h2>
            <p className="mt-2 text-sm text-iua-muted">{body}</p>
          </Link>
        ))}
      </div>
    </PublicPage>
  );
}
