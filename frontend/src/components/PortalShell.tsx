"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/intl/LanguageSwitcher";
import { UserAvatar } from "@/components/UserAvatar";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { apiGet, apiLogout, AuthUser, clearApiMemoryCache } from "@/lib/api";
import { getAccessToken, getStoredUser, setStoredUser } from "@/lib/auth";
import { PortalGroup } from "@/lib/navigation";

/** Visible label even if i18n key is missing or returns empty. */
function humanizeKey(key: unknown): string {
  if (typeof key !== "string" || !key.trim()) return "Menu";
  const last = key.includes(".") ? key.slice(key.lastIndexOf(".") + 1) : key;
  return last
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function safeT(
  translate: (key: string) => string,
  key: string,
  has?: (key: string) => boolean,
): string | null {
  try {
    if (typeof has === "function" && !has(key)) return null;
    const value = translate(key);
    if (typeof value === "string" && value.trim().length > 0 && !value.startsWith("portal.")) {
      return value;
    }
  } catch {
    /* missing / corrupt message */
  }
  return null;
}

export function PortalShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: PortalGroup[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations();
  const tc = useTranslations("common");
  const tp = useTranslations("portal");

  function tr(key: unknown): string {
    if (typeof key !== "string" || !key) return "Menu";
    return (
      safeT(
        (k) => t(k as Parameters<typeof t>[0]),
        key,
        typeof t.has === "function" ? (k) => t.has(k as Parameters<typeof t.has>[0]) : undefined,
      ) || humanizeKey(key)
    );
  }

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored || !getAccessToken()) {
      router.replace("/connexion");
      return;
    }
    setUser(stored);
    apiGet<AuthUser>("/auth/me/")
      .then((fresh) => {
        setStoredUser(fresh);
        setUser(fresh);
      })
      .catch(() => {
        /* keep stored user; api layer redirects on hard 401 */
      });
  }, [router]);

  async function logout() {
    clearApiMemoryCache();
    await apiLogout();
    router.push("/connexion");
  }

  const roles = user?.roles || [];
  const filteredNav = nav
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => {
        if (link.href === "/portail/direction") {
          return roles.some((r) =>
            ["direction", "super_admin", "academic_dir", "finance_dir", "admin"].includes(r),
          );
        }
        return true;
      }),
    }))
    .filter((g) => g.links.length > 0);

  if (!user) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-iua-mist text-iua-navy">
        {tc("openingSpace")}
      </main>
    );
  }

  return (
    <div className="min-h-[100svh] bg-iua-mist">
      <header className="sticky top-0 z-20 border-b border-iua-navy/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-iua-navy text-white lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              {menuOpen ? "×" : "☰"}
            </button>
            <Link href="/" className="flex items-center gap-3">
              <BrandLogo className="h-9 w-auto" />
              <span className="hidden text-xs uppercase tracking-[0.16em] text-iua-muted sm:block">
                Digital Campus
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher solid />
            <div className="hidden text-end sm:block">
              <p className="text-sm font-semibold text-iua-navy">{user.full_name}</p>
              <p className="text-xs text-iua-muted">{title}</p>
            </div>
            <UserAvatar user={user} size="sm" className="ring-iua-navy/10" />
            <button
              onClick={() => void logout()}
              className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm text-iua-navy transition hover:bg-iua-navy hover:text-white"
            >
              {safeT((k) => tp(k as Parameters<typeof tp>[0]), "logout") || "Déconnexion"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[260px_1fr]">
        <aside
          className={`${
            menuOpen ? "block" : "hidden"
          } bg-[#0A2342] px-3 py-5 text-white lg:block lg:min-h-[calc(100svh-65px)]`}
        >
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            {safeT((k) => tp(k as Parameters<typeof tp>[0]), "nav") || "Navigation"}
          </p>
          <div className="mt-4 space-y-5">
            {filteredNav.map((group) => (
              <div key={group.titleKey}>
                <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3DB8E8]">
                  {tr(group.titleKey)}
                </p>
                <ul className="mt-2 space-y-1">
                  {group.links.map((link) => {
                    const active =
                      pathname === link.href ||
                      (link.href !== "/portail/enseignant" &&
                        link.href !== "/portail/etudiant" &&
                        link.href !== "/portail/admin" &&
                        link.href !== "/portail/direction" &&
                        pathname.startsWith(link.href));
                    const soon = link.status === "soon";
                    const label = tr(link.labelKey);
                    return (
                      <li key={link.href}>
                        <Link
                          href={soon ? "#" : link.href}
                          onClick={(e) => {
                            if (soon) e.preventDefault();
                            setMenuOpen(false);
                          }}
                          className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition ${
                            active
                              ? "bg-[#3DB8E8] text-[#0A2342] shadow-sm"
                              : soon
                                ? "cursor-default text-white/35"
                                : "text-white/90 hover:bg-white/10"
                          }`}
                        >
                          <span>{label}</span>
                          {soon && (
                            <span className="text-[10px] uppercase tracking-wide text-white/50">
                              {tc("soon")}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <main className="px-4 py-8 sm:px-6 lg:px-8 animate-[fadeUp_0.35s_ease_both]">
          {children}
        </main>
      </div>
    </div>
  );
}
