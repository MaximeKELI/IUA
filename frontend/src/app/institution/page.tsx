import { PublicPage } from "@/components/PublicPage";

export default function InstitutionPage() {
  return (
    <PublicPage
      eyebrow="Institution"
      title="Institut Universitaire d'Abidjan"
      lead="Université privée à Abidjan, engagée pour former des professionnels qualifiés et dynamiques."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <article className="rounded-xl bg-white p-6 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Notre ambition</h2>
          <p className="mt-3 text-sm leading-relaxed text-iua-muted">
            Former des talents prêts pour un marché de l&apos;emploi exigeant, grâce à des
            programmes accrédités, des partenariats internationaux et un accompagnement
            professionnel structuré.
          </p>
        </article>
        <article className="rounded-xl bg-white p-6 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Digital Campus</h2>
          <p className="mt-3 text-sm leading-relaxed text-iua-muted">
            Le SIU centralise académique, finance, pédagogie et services de campus derrière
            une identité numérique unique.
          </p>
        </article>
      </div>
    </PublicPage>
  );
}
