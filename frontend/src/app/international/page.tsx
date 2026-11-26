import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";

export default function InternationalPage() {
  return (
    <PublicPage
      eyebrow="Mobilité"
      title="Étudiants internationaux"
      lead="Informations regroupées : séjour, transport, logement et admission."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Séjour en Côte d'Ivoire", "Cadre de vie et démarches d'accueil"],
          ["Transport & logement", "Options pour s'installer à Abidjan"],
          ["Admission", "Candidature et équivalences"],
        ].map(([title, body]) => (
          <article key={title} className="rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">{title}</h2>
            <p className="mt-2 text-sm text-iua-muted">{body}</p>
          </article>
        ))}
      </div>
      <Link
        href="/admissions"
        className="mt-8 inline-flex rounded-md bg-iua-sun px-5 py-3 text-sm font-semibold text-iua-navy"
      >
        Commencer une candidature
      </Link>
    </PublicPage>
  );
}
