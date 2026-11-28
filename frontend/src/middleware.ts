import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { canAccessPortalPath } from "./lib/portalAccess";
import { resolveHomePath } from "./lib/authPaths";

const intlMiddleware = createMiddleware(routing);

const PORTAL_RE = /^\/(fr|en|pt|es|ar)\/portail(\/|$)/;
const LOGIN_RE = /^\/(fr|en|pt|es|ar)\/connexion(\/|$)/;

/** Minimal JWT exp check (no signature verify in Edge — presence + expiry only). */
function accessLooksValid(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now() - 30_000;
  } catch {
    return false;
  }
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const intlResponse = intlMiddleware(request);

  if (PORTAL_RE.test(pathname)) {
    const access = request.cookies.get("iua_access")?.value;
    if (!access || !accessLooksValid(access)) {
      const locale = pathname.split("/")[1] || "fr";
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/connexion`;
      const res = NextResponse.redirect(url);
      if (access && !accessLooksValid(access)) {
        res.cookies.set("iua_access", "", { path: "/", maxAge: 0 });
        res.cookies.set("iua_refresh", "", { path: "/", maxAge: 0 });
        res.cookies.set("iua_roles", "", { path: "/", maxAge: 0 });
      }
      return res;
    }
    const rolesRaw = request.cookies.get("iua_roles")?.value;
    let roles: string[] = [];
    try {
      roles = rolesRaw ? (JSON.parse(rolesRaw) as string[]) : [];
    } catch {
      roles = [];
    }
    const withoutLocale = "/" + pathname.split("/").slice(2).join("/");
    const path = withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`;
    if (roles.length && !canAccessPortalPath(path, roles)) {
      const locale = pathname.split("/")[1] || "fr";
      const home = resolveHomePath(roles).replace(/^\//, "");
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/${home}`;
      return NextResponse.redirect(url);
    }
  }

  if (LOGIN_RE.test(pathname) && request.cookies.get("iua_access")?.value) {
    /* allow page — client redirects by role */
  }

  return intlResponse;
}

export const config = {
  matcher: ["/", "/(fr|en|pt|es|ar)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
