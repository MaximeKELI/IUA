"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { apiLogout, apiUpload, clearApiMemoryCache } from "@/lib/api";
import {
  getAccessToken,
  getStoredUser,
  resolveHomePath,
  setStoredUser,
  type AuthUser,
} from "@/lib/auth";

export function AuthHeaderActions({ solid = false }: { solid?: boolean }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("common");

  useEffect(() => {
    if (getAccessToken()) {
      setUser(getStoredUser());
    } else {
      setUser(null);
    }
  }, []);

  async function onPickPhoto(file: File | null) {
    if (!file || !user) return;
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const updated = await apiUpload<AuthUser>("/auth/me/", getAccessToken(), fd, "PATCH");
      setStoredUser(updated);
      setUser(updated);
      setMsg("Photo mise à jour.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Échec upload");
    }
  }

  if (user) {
    const home = resolveHomePath(user.roles);
    return (
      <div className="relative flex items-center gap-2 sm:gap-3">
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
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full p-0.5 transition ${
            solid ? "hover:bg-iua-mist" : "hover:bg-white/10"
          }`}
          aria-label="Menu profil"
          aria-expanded={open}
        >
          <UserAvatar
            user={user}
            size="sm"
            className={solid ? "ring-iua-navy/10" : "ring-white/40"}
          />
          <span
            className={`hidden text-sm font-semibold sm:inline ${solid ? "text-iua-navy" : "text-white"}`}
          >
            {user.first_name}
          </span>
        </button>

        {open && (
          <div className="absolute end-0 top-full z-50 mt-2 w-64 rounded-xl bg-white p-3 text-iua-navy shadow-soft ring-1 ring-iua-navy/10">
            <div className="flex items-center gap-3 border-b border-iua-navy/10 pb-3">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.full_name}</p>
                <p className="truncate text-xs text-iua-muted">{user.email}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              <Link
                href={home}
                className="rounded-md px-3 py-2 font-medium hover:bg-iua-mist"
                onClick={() => setOpen(false)}
              >
                {t("mySpace")}
              </Link>
              <button
                type="button"
                className="rounded-md px-3 py-2 text-start font-medium hover:bg-iua-mist"
                onClick={() => fileRef.current?.click()}
              >
                Changer la photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  void onPickPhoto(e.target.files?.[0] || null);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="rounded-md px-3 py-2 text-start font-medium text-red-700 hover:bg-red-50"
                onClick={() => {
                  setOpen(false);
                  setLogoutOpen(true);
                }}
              >
                {t("logout")}
              </button>
            </div>
            {msg && <p className="mt-2 px-1 text-xs text-emerald-700">{msg}</p>}
          </div>
        )}

        <ConfirmDialog
          open={logoutOpen}
          title={t("logoutConfirmTitle")}
          description={t("logoutConfirmBody")}
          confirmLabel={t("logoutConfirmAction")}
          cancelLabel={t("cancel")}
          tone="danger"
          busy={logoutBusy}
          onCancel={() => {
            if (!logoutBusy) setLogoutOpen(false);
          }}
          onConfirm={() => {
            void (async () => {
              setLogoutBusy(true);
              try {
                clearApiMemoryCache();
                await apiLogout();
                window.location.href = "/";
              } finally {
                setLogoutBusy(false);
              }
            })();
          }}
        />
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
