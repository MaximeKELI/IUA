import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";

const programs = [
  {
    level: "Licence",
    name: "Licence en Gestion",
    faculty: "Faculté des Sciences Économiques et de Gestion",
  },
  {
    level: "Licence",
    name: "Licence en Informatique",
    faculty: "Faculté des Sciences et Technologies",
  },
  {
    level: "Master",
    name: "Master en Management",
    faculty: "Faculté des Sciences Économiques et de Gestion",
  },
];

export default function FormationsPage() {
  return (
    <PublicPage
      eyebrow="Catalogue"
      title="Formations"
      lead="Licences et masters présentés par niveau — sans mélanger les menus du site institutionnel."
    >
      <div className="space-y-4">
        {programs.map((p) => (
          <article
            key={p.name}
            className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-iua-cyan">{p.level}</p>
              <h2 className="mt-1 font-display text-2xl text-iua-navy">{p.name}</h2>
              <p className="mt-1 text-sm text-iua-muted">{p.faculty}</p>
            </div>
            <Link
              href="/admissions"
              className="inline-flex rounded-md bg-iua-sun px-4 py-2.5 text-sm font-semibold text-iua-navy"
            >
              Candidater
            </Link>
          </article>
        ))}
      </div>
    </PublicPage>
  );
}
