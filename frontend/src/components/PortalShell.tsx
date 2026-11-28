"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LanguageSwitcher } from "@/components/intl/LanguageSwitcher";
import { PortalCommandPalette } from "@/components/PortalCommandPalette";
import { Breadcrumbs, type Crumb } from "@/components/ux";
import { UserAvatar } from "@/components/UserAvatar";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { apiGet, apiLogout, AuthUser, clearApiMemoryCache, Page, syncSessionCookies, unwrapList } from "@/lib/api";
import { getAccessToken, getRefreshToken, getStoredUser, resolveHomePath, setStoredUser } from "@/lib/auth";
import { PortalGroup } from "@/lib/navigation";
import { canAccessPortalPath } from "@/lib/portalAccess";

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

function notificationsHref(pathname: string): string {
  if (pathname.startsWith("/portail/enseignant")) return "/portail/enseignant/notifications";
  if (pathname.startsWith("/portail/admin")) return "/portail/admin/notifications";
  if (pathname.startsWith("/portail/direction")) return "/portail/direction/notifications";
  return "/portail/etudiant/notifications";
}

function profileLinks(pathname: string): { href: string; labelKey: string }[] {
  if (pathname.startsWith("/portail/etudiant")) {
    return [
      { href: "/portail/etudiant/carte", labelKey: "portal.student.card" },
      { href: "/portail/etudiant/confidentialite", labelKey: "portal.student.privacy" },
    ];
  }
  if (pathname.startsWith("/portail/enseignant")) {
    return [{ href: "/portail/enseignant", labelKey: "portal.teacher.dashboard" }];
  }
  return [];
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
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const drawerRef = useRef<HTMLElement>(null);
  const t = useTranslations();
  const tc = useTranslations("common");
  const tp = useTranslations("portal");

  const tr = useCallback(
    (key: unknown): string => {
      if (typeof key !== "string" || !key) return "Menu";
      return (
        safeT(
          (k) => t(k as Parameters<typeof t>[0]),
          key,
          typeof t.has === "function" ? (k) => t.has(k as Parameters<typeof t.has>[0]) : undefined,
        ) || humanizeKey(key)
      );
    },
    [t],
  );

  useEffect(() => {
    const stored = getStoredUser();
    const access = getAccessToken();
    if (!stored || !access) {
      router.replace("/connexion");
      return;
    }
    if (!canAccessPortalPath(pathname, stored.roles || [])) {
      router.replace(resolveHomePath(stored.roles || []));
      return;
    }
    setUser(stored);
    const refresh = getRefreshToken();
    if (refresh) {
      void syncSessionCookies(access, refresh, stored.roles);
    }
    apiGet<AuthUser>("/auth/me/")
      .then((fresh) => {
        setStoredUser(fresh);
        setUser(fresh);
        if (!canAccessPortalPath(pathname, fresh.roles || [])) {
          router.replace(resolveHomePath(fresh.roles || []));
        }
        if (refresh) void syncSessionCookies(access, refresh, fresh.roles);
      })
      .catch(() => {
        /* keep stored user */
      });
  }, [router, pathname]);

  useEffect(() => {
    if (!user) return;
    apiGet<Page<{ is_read: boolean }>>("/notifications/?page_size=50")
      .then((data) => {
        const list = unwrapList(data);
        setUnread(list.filter((n) => !n.is_read).length);
      })
      .catch(() => setUnread(0));
  }, [user, pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = drawerRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  async function confirmLogout() {
    setLogoutBusy(true);
    try {
      clearApiMemoryCache();
      await apiLogout();
      router.push("/connexion");
    } finally {
      setLogoutBusy(false);
      setLogoutOpen(false);
    }
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

  const crumbs: Crumb[] = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    // pathname from next-intl is without locale: /portail/etudiant/notes
    const home =
      parts[1] === "enseignant"
        ? "/portail/enseignant"
        : parts[1] === "admin"
          ? "/portail/admin"
          : parts[1] === "direction"
            ? "/portail/direction"
            : "/portail/etudiant";
    const items: Crumb[] = [{ href: home, label: title }];
    if (parts.length >= 3) {
      const slug = parts[2];
      const roleKey =
        parts[1] === "enseignant"
          ? "teacher"
          : parts[1] === "admin"
            ? "admin"
            : parts[1] === "direction"
              ? "direction"
              : "student";
      const pageKey = `pages.${roleKey}.${slug}`;
      const label =
        safeT((k) => tp(k as Parameters<typeof tp>[0]), pageKey) ||
        humanizeKey(slug);
      items.push({ label });
    }
    return items;
  }, [pathname, title, tp]);

  const notifHref = notificationsHref(pathname);
  const avatarLinks = profileLinks(pathname);

  function renderNav(onNavigate?: () => void) {
    return (
      <div className="mt-4 space-y-5">
        {filteredNav.map((group) => (
          <div key={group.titleKey}>
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "#3DB8E8" }}>
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
                    {soon ? (
                      <button
                        type="button"
                        disabled
                        className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium"
                        style={{ color: "rgba(255,255,255,0.35)", cursor: "not-allowed" }}
                      >
                        <span>{label}</span>
                        <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
                          {tc("soon")}
                        </span>
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={() => onNavigate?.()}
                        className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition"
                        style={
                          active
                            ? { backgroundColor: "#3DB8E8", color: "#0A2342" }
                            : { color: "rgba(255,255,255,0.92)" }
                        }
                      >
                        <span>{label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-iua-mist text-iua-navy">
        {tc("openingSpace")}
      </main>
    );
  }

  return (
    <div className="min-h-[100svh] bg-iua-mist">
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-iua-navy"
      >
        {tc("skipToContent")}
      </a>
      <header className="sticky top-0 z-30 border-b border-iua-navy/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-iua-navy text-white lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label={tc("menu")}
              aria-expanded={menuOpen}
              aria-controls="portal-nav-drawer"
            >
              ☰
            </button>
            <Link href="/" className="flex items-center gap-3">
              <BrandLogo className="h-9 w-auto" />
              <span className="hidden text-xs uppercase tracking-[0.16em] text-iua-muted sm:block">
                Digital Campus
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden rounded-md border border-iua-navy/15 px-3 py-2 text-xs font-semibold text-iua-navy sm:inline-flex"
              aria-label={tc("openSearch")}
            >
              {tc("search")}
              <kbd className="ms-2 rounded bg-iua-mist px-1.5 py-0.5 text-[10px] text-iua-muted">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-iua-navy/15 text-iua-navy sm:hidden"
              aria-label={tc("openSearch")}
            >
              ⌕
            </button>
            <Link
              href={notifHref}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-iua-navy/15 text-iua-navy"
              aria-label={tc("notifications")}
            >
              <span aria-hidden="true">🔔</span>
              {unread > 0 && (
                <span className="absolute -end-1 -top-1 min-w-[1.1rem] rounded-full bg-red-600 px-1 text-center text-[10px] font-bold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <LanguageSwitcher solid />
            <div className="hidden text-end sm:block">
              <p className="text-sm font-semibold text-iua-navy">{user.full_name}</p>
              <p className="text-xs text-iua-muted">{title}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAvatarOpen((v) => !v)}
                aria-expanded={avatarOpen}
                aria-label={tc("profile")}
                className="rounded-full ring-1 ring-iua-navy/10"
              >
                <UserAvatar user={user} size="sm" />
              </button>
              {avatarOpen && (
                <div className="absolute end-0 z-40 mt-2 w-52 rounded-xl bg-white p-2 shadow-soft ring-1 ring-iua-navy/10">
                  {avatarLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setAvatarOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-iua-navy hover:bg-iua-mist"
                    >
                      {tr(l.labelKey)}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarOpen(false);
                      setLogoutOpen(true);
                    }}
                    className="mt-1 w-full rounded-md px-3 py-2 text-start text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    {tc("logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={logoutOpen}
        title={tc("logoutConfirmTitle")}
        description={tc("logoutConfirmBody")}
        confirmLabel={tc("logoutConfirmAction")}
        cancelLabel={tc("cancel")}
        tone="danger"
        busy={logoutBusy}
        onCancel={() => {
          if (!logoutBusy) setLogoutOpen(false);
        }}
        onConfirm={() => void confirmLogout()}
      />

      <PortalCommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        nav={filteredNav}
        tr={tr}
      />

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-iua-navy/45"
            aria-label={tc("close")}
            onClick={() => setMenuOpen(false)}
          />
          <aside
            ref={drawerRef}
            id="portal-nav-drawer"
            className="absolute inset-y-0 start-0 flex w-[min(86vw,280px)] flex-col overflow-y-auto px-3 py-5 shadow-soft"
            style={{ backgroundColor: "#0A2342", color: "#ffffff" }}
            aria-label={tp("nav")}
          >
            <div className="mb-4 flex items-center justify-between px-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.55)" }}>
                {tp("nav")}
              </p>
              <button type="button" className="text-white" onClick={() => setMenuOpen(false)} aria-label={tc("close")}>
                ×
              </button>
            </div>
            {renderNav(() => setMenuOpen(false))}
          </aside>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[260px_1fr]">
        <aside
          id="portal-nav"
          className="hidden px-3 py-5 lg:block lg:min-h-[calc(100svh-65px)]"
          style={{ backgroundColor: "#0A2342", color: "#ffffff" }}
          aria-label={tp("nav")}
        >
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.55)" }}>
            {tp("nav")}
          </p>
          {renderNav()}
        </aside>

        <main id="portal-main" className="px-4 py-8 sm:px-6 lg:px-8 animate-[fadeUp_0.35s_ease_both]">
          <Breadcrumbs items={crumbs} />
          {children}
        </main>
      </div>
    </div>
  );
}
