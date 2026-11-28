"use client";

import { useEffect, useRef, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { UserAvatar } from "@/components/UserAvatar";
import { apiGetCached, apiUpload } from "@/lib/api";
import {
  getAccessToken,
  getStoredUser,
  setStoredUser,
  type AuthUser,
} from "@/lib/auth";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Dash = {
  full_name?: string;
  profile: {
    student_number: string | null;
    program: string | null;
    cohort: string | null;
    level: string | null;
    status?: string | null;
    email?: string;
  };
};

export default function CartePage() {
  const { token, ready } = useAuthToken();
  const [data, setData] = useState<Dash | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready || !token) return;
    setUser(getStoredUser());
    apiGetCached<Dash>("/portal/student/dashboard/", token, 12000).then(setData);
    apiGetCached<AuthUser>("/auth/me/", token, 5000)
      .then((me) => {
        setStoredUser(me);
        setUser(me);
      })
      .catch(() => undefined);
  }, [ready, token]);

  async function onPhoto(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const updated = await apiUpload<AuthUser>("/auth/me/", getAccessToken(), fd, "PATCH");
      setStoredUser(updated);
      setUser(updated);
      setMsg("Photo de profil mise à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">Carte / profil</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Votre identité numérique IUA — ajoutez une photo et présentez votre carte sur le campus.
      </p>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {user && <UserAvatar user={user} size="xl" className="ring-iua-navy/10 shadow-soft" />}
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white"
          >
            {user?.avatar_url ? "Changer la photo" : "Ajouter une photo"}
          </button>
          <p className="mt-2 text-xs text-iua-muted">JPG, PNG ou WebP · max 2 Mo</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              void onPhoto(e.target.files?.[0] || null);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {data && (
        <div className="mt-8 max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-iua-navy to-iua-blue p-6 text-white shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.2em] text-iua-cyan">
              Institut Universitaire d&apos;Abidjan
            </p>
            {user && <UserAvatar user={user} size="md" className="ring-white/30" />}
          </div>
          <p className="mt-6 font-display text-3xl">{data.full_name}</p>
          <p className="mt-2 font-mono text-lg text-iua-sun">
            {data.profile.student_number || "—"}
          </p>
          <div className="mt-6 space-y-1 text-sm text-white/80">
            <p>{data.profile.program}</p>
            <p>
              {data.profile.cohort} · {data.profile.level}
            </p>
            <p>{data.profile.email}</p>
            <p className="text-xs uppercase tracking-wide text-white/50">
              {data.profile.status}
            </p>
          </div>
          <p className="mt-8 text-[10px] uppercase tracking-[0.16em] text-white/40">
            Digital Campus · Carte étudiante
          </p>
        </div>
      )}
    </PortalShell>
  );
}
