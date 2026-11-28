import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/BrandLogo";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const n = await getTranslations("nav");

  return (
    <footer className="bg-iua-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <BrandLogo variant="white" className="h-12 w-auto" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">{t("tagline")}</p>
          <p className="mt-3 text-xs text-white/45">{t("officeHours")}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">{t("paths")}</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link className="transition hover:text-white" href="/formations" prefetch={false}>
                {n("programs")}
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-white" href="/admissions">
                {n("admissions")}
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-white" href="/connexion">
                {n("portal")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">{t("international")}</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link className="transition hover:text-white" href="/international">
                {n("international")}
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-white" href="/international/visa">
                {n("visa")}
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-white" href="/international/bourses">
                {n("scholarships")}
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-white" href="/international/legal">
                {n("legal")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">{t("contact")}</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>{t("address")}</li>
            <li>
              <a className="transition hover:text-white" href="mailto:international@iua-ci.org">
                international@iua-ci.org
              </a>
            </li>
            <li>
              <a className="transition hover:text-white" href="tel:+2252722422265">
                +225 27 224 222 65
              </a>
            </li>
            <li>
              <a
                className="transition hover:text-white"
                href="https://www.linkedin.com/school/institut-universitaire-d-abidjan/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/45">
        © {new Date().getFullYear()} {t("rights")}
      </div>
    </footer>
  );
}
