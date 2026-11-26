import Image from "next/image";
import { PublicPage } from "@/components/PublicPage";

export default function CampusPage() {
  return (
    <PublicPage
      eyebrow="Campus"
      title="Un cadre d'apprentissage moderne"
      lead="Infrastructures, vie étudiante et services du quotidien à Abidjan."
    >
      <div className="overflow-hidden rounded-2xl">
        <Image
          src="/brand/campus-hero.jpg"
          alt="Étudiantes IUA sur le campus"
          width={1200}
          height={700}
          className="h-auto w-full object-cover"
        />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {[
          ["Infrastructures", "Salles équipées, ressources numériques, bibliothèque"],
          ["Vie étudiante", "Clubs, sport, entraide et activités"],
          ["Services", "Transport, restauration, accompagnement"],
        ].map(([title, body]) => (
          <article key={title} className="border-t border-iua-navy/15 pt-4">
            <h2 className="font-display text-xl text-iua-navy">{title}</h2>
            <p className="mt-2 text-sm text-iua-muted">{body}</p>
          </article>
        ))}
      </div>
    </PublicPage>
  );
}
