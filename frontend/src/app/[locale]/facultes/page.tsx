import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";

export default function FacultesPage() {
  return (
    <PublicPage
      eyebrow="Institution"
      title="Facultés"
      lead="Chaque faculté regroupe ses formations et ses départements."
    >
      <ul className="space-y-4">
        {[
          "Faculté des Sciences Économiques et de Gestion",
          "Faculté des Sciences et Technologies",
          "Faculté de Droit et Sciences Politiques",
        ].map((name) => (
          <li key={name} className="rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">{name}</h2>
            <Link href="/formations" className="mt-3 inline-block text-sm font-semibold text-iua-blue">
              Voir les formations →
            </Link>
          </li>
        ))}
      </ul>
    </PublicPage>
  );
}
