import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-iua-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Image
            src="/brand/logo-iua-white.png"
            alt="IUA"
            width={140}
            height={120}
            className="h-12 w-auto"
            loading="lazy"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            Institut Universitaire d&apos;Abidjan — excellence académique, insertion
            professionnelle et campus numérique intégré.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Parcours</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link className="transition hover:text-white" href="/formations" prefetch={false}>
                Formations
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-white" href="/admissions">
                Admissions
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-white" href="/connexion">
                Portail Digital Campus
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Contact</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>II Plateaux, 7ème Tranche, Abidjan</li>
            <li>
              <a className="transition hover:text-white" href="mailto:info@iua-ci.org">
                info@iua-ci.org
              </a>
            </li>
            <li>
              <a className="transition hover:text-white" href="tel:+2252722422265">
                +225 27 224 222 65
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/45">
        © {new Date().getFullYear()} Institut Universitaire d&apos;Abidjan · Digital Campus
      </div>
    </footer>
  );
}
