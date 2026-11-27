import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";

const steps = [
  {
    n: "01",
    title: "Choisir une formation",
    body: "Parcourez le catalogue et sélectionnez le programme adapté.",
  },
  {
    n: "02",
    title: "Déposer le dossier",
    body: "Formulaire unique, pièces justificatives et suivi en ligne.",
  },
  {
    n: "03",
    title: "Recevoir la décision",
    body: "Vous êtes informé à chaque étape de validation.",
  },
  {
    n: "04",
    title: "Finaliser l'inscription",
    body: "Paiement puis activation de votre compte étudiant.",
  },
];

export default function AdmissionsPage() {
  return (
    <PublicPage
      eyebrow="Admissions"
      title="Comment s'inscrire"
      lead="Quatre étapes, du choix de formation à l'activation de votre espace étudiant."
    >
      <ol className="grid gap-6 md:grid-cols-2">
        {steps.map((step) => (
          <li key={step.n} className="rounded-xl bg-white p-6 shadow-soft">
            <p className="font-mono text-sm text-iua-cyan">{step.n}</p>
            <h2 className="mt-2 font-display text-2xl text-iua-navy">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-iua-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/formations"
          className="rounded-md bg-iua-navy px-5 py-3 text-sm font-semibold text-white"
        >
          Voir les formations
        </Link>
        <Link
          href="/connexion"
          className="rounded-md border border-iua-navy/15 bg-white px-5 py-3 text-sm font-semibold text-iua-navy"
        >
          J&apos;ai déjà un compte
        </Link>
      </div>

      <p className="mt-8 text-sm text-iua-muted">
        Le dépôt de candidature en ligne sera bientôt disponible sur ce parcours.
      </p>
    </PublicPage>
  );
}
