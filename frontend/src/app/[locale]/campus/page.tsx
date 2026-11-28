import { PublicPage } from "@/components/PublicPage";

export default function CampusPage() {
  return (
    <PublicPage
      eyebrow="Campus"
      title="Un cadre d'apprentissage moderne"
      lead="Infrastructures, vie étudiante et services du quotidien à Abidjan."
    >
      <div
        className="h-64 overflow-hidden rounded-2xl bg-cover bg-[position:center_18%] sm:h-80 md:h-[28rem]"
        style={{ backgroundImage: "url('/brand/campus-hero.png')" }}
        role="img"
        aria-label="Étudiantes IUA sur le campus"
      />
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
