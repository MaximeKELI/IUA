"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthUser } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/auth";
import { PortalGroup } from "@/lib/navigation";

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

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/connexion");
      return;
    }
    setUser(stored);
  }, [router]);

  function logout() {
    clearSession();
    router.push("/connexion");
  }

  if (!user) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-iua-mist text-iua-navy">
        Ouverture de votre espace…
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-iua-mist text-iua-navy lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu portail"
            >
              {menuOpen ? "×" : "☰"}
            </button>
            <Link href="/" className="flex items-center gap-3">
              <Image src="/brand/logo-iua.png" alt="IUA" width={112} height={42} className="h-9 w-auto" />
              <span className="hidden text-xs uppercase tracking-[0.16em] text-iua-muted sm:block">
                Digital Campus
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-iua-navy">{user.full_name}</p>
              <p className="text-xs text-iua-muted">{title}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm text-iua-navy transition hover:bg-iua-navy hover:text-white"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[260px_1fr]">
        <aside
          className={`${
            menuOpen ? "block" : "hidden"
          } border-b border-iua-navy/10 bg-white px-4 py-5 lg:block lg:min-h-[calc(100svh-65px)] lg:border-b-0 lg:border-r`}
        >
          <p className="px-2 text-[11px] uppercase tracking-[0.18em] text-iua-muted">Navigation</p>
          <div className="mt-4 space-y-6">
            {nav.map((group) => (
              <div key={group.title}>
                <p className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-iua-navy/45">
                  {group.title}
                </p>
                <ul className="mt-2 space-y-1">
                  {group.links.map((link) => {
                    const active = pathname === link.href;
                    const soon = link.status === "soon";
                    return (
                      <li key={link.href}>
                        <Link
                          href={soon ? "#" : link.href}
                          onClick={(e) => {
                            if (soon) e.preventDefault();
                            setMenuOpen(false);
                          }}
                          className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition ${
                            active
                              ? "bg-iua-navy text-white"
                              : soon
                                ? "cursor-default text-iua-muted/60"
                                : "text-iua-navy/80 hover:bg-iua-mist"
                          }`}
                        >
                          <span>{link.label}</span>
                          {soon && <span className="text-[10px] uppercase tracking-wide">Bientôt</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
