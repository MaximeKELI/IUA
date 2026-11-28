import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PORTAL_RE = /^\/(fr|en|pt|es|ar)\/portail(\/|$)/;
const LOGIN_RE = /^\/(fr|en|pt|es|ar)\/connexion(\/|$)/;

function canAccess(pathWithoutLocale: string, roles: string[]): boolean {
  if (!pathWithoutLocale.startsWith("/portail")) return true;
  const admin = ["admin", "super_admin", "secretariat", "academic_dir", "faculty_head", "dept_head", "hr", "it"];
  const direction = ["direction", "super_admin", "finance_dir", "admin", "academic_dir"];
  if (pathWithoutLocale.startsWith("/portail/etudiant")) {
    return roles.some((r) => ["student", "alumni", ...admin].includes(r));
  }
  if (pathWithoutLocale.startsWith("/portail/enseignant")) {
    return roles.some((r) => ["teacher", ...admin].includes(r));
  }
  if (pathWithoutLocale.startsWith("/portail/admin")) {
    return roles.some((r) => [...admin, ...direction].includes(r));
  }
  if (pathWithoutLocale.startsWith("/portail/direction")) {
    return roles.some((r) => direction.includes(r));
  }
  return roles.length > 0;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const intlResponse = intlMiddleware(request);

  if (PORTAL_RE.test(pathname)) {
    const access = request.cookies.get("iua_access")?.value;
    if (!access) {
      const locale = pathname.split("/")[1] || "fr";
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/connexion`;
      return NextResponse.redirect(url);
    }
    const rolesRaw = request.cookies.get("iua_roles")?.value;
    let roles: string[] = [];
    try {
      roles = rolesRaw ? (JSON.parse(rolesRaw) as string[]) : [];
    } catch {
      roles = [];
    }
    const withoutLocale = "/" + pathname.split("/").slice(2).join("/");
    if (roles.length && !canAccess(withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`, roles)) {
      const locale = pathname.split("/")[1] || "fr";
      const home =
        roles.includes("direction") || roles.includes("super_admin") || roles.includes("finance_dir")
          ? "direction"
          : roles.some((r) => ["admin", "secretariat", "academic_dir", "it"].includes(r))
            ? "admin"
            : roles.includes("teacher")
              ? "enseignant"
              : "etudiant";
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/portail/${home}`;
      return NextResponse.redirect(url);
    }
  }

  // Already logged-in users hitting login → bounce to portal root (client also handles)
  if (LOGIN_RE.test(pathname) && request.cookies.get("iua_access")?.value) {
    /* allow page — client redirects by role */
  }

  return intlResponse;
}

export const config = {
  matcher: ["/", "/(fr|en|pt|es|ar)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
