"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/auth";

export function PortalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

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
      <main className="flex min-h-[100svh] items-center justify-center bg-iua-sand text-iua-navy">
        Chargement du portail…
      </main>
    );
  }

  return (
    <div className="min-h-[100svh] bg-iua-sand">
      <header className="border-b border-iua-navy/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="font-display text-lg text-iua-navy">
              IUA Digital Campus
            </Link>
            <p className="text-xs uppercase tracking-[0.16em] text-iua-navy/50">{title}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-iua-navy/70 sm:inline">{user.full_name}</span>
            <button
              onClick={logout}
              className="rounded-full border border-iua-navy/15 px-4 py-2 text-iua-navy transition hover:bg-iua-navy hover:text-white"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
