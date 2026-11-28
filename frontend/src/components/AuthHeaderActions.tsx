"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { apiLogout } from "@/lib/api";
import { getAccessToken, getStoredUser, resolveHomePath, type AuthUser } from "@/lib/auth";

export function AuthHeaderActions({ solid = false }: { solid?: boolean }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const t = useTranslations("common");

  useEffect(() => {
    if (getAccessToken()) {
      setUser(getStoredUser());
    } else {
      setUser(null);
    }
  }, []);

  if (user) {
    const home = resolveHomePath(user.roles);
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href={home}
          className={`hidden rounded-md px-4 py-2.5 text-sm font-semibold transition sm:inline-flex ${
            solid ? "bg-iua-navy text-white hover:bg-iua-blue" : "bg-white text-iua-navy hover:bg-white/90"
          }`}
        >
          {t("mySpace")}
        </Link>
        <button
          type="button"
          onClick={async () => {
            await apiLogout();
            window.location.href = "/";
          }}
          className={`rounded-md px-3 py-2.5 text-sm font-semibold transition ${
            solid
              ? "border border-iua-navy/15 text-iua-navy hover:bg-iua-mist"
              : "border border-white/30 text-white hover:bg-white/10"
          }`}
        >
          {t("logout")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/connexion"
        prefetch
        className={`hidden rounded-md px-4 py-2.5 text-sm font-semibold transition sm:inline-flex ${
          solid ? "text-iua-navy hover:bg-iua-mist" : "text-white hover:bg-white/10"
        }`}
      >
        {t("login")}
      </Link>
      <Link
        href="/admissions"
        prefetch
        className="btn-shine rounded-md bg-iua-sun px-4 py-2.5 text-sm font-semibold text-iua-navy shadow-soft transition hover:brightness-105"
      >
        {t("register")}
      </Link>
    </div>
  );
}
