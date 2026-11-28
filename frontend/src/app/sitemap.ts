import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const paths = [
  "",
  "/admissions",
  "/formations",
  "/etudier",
  "/facultes",
  "/campus",
  "/institution",
  "/contact",
  "/connexion",
  "/international",
  "/international/visa",
  "/international/equivalences",
  "/international/ects",
  "/international/partenaires",
  "/international/faq",
  "/international/arrivee",
  "/international/bureau",
  "/international/bourses",
  "/international/guides",
  "/international/legal",
  "/international/alumni",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const path of paths) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path.includes("international") ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/international" ? 0.9 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
          ),
        },
      });
    }
  }
  return entries;
}
