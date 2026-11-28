"use client";

import { FormEvent, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { apiLogin, apiMfaVerify, syncSessionCookies } from "@/lib/api";
import { getAccessToken, getStoredUser, resolveHomePath, saveSession } from "@/lib/auth";

const DEMO_LOGIN = process.env.NEXT_PUBLIC_DEMO_LOGIN === "true";

const presets = DEMO_LOGIN
  ? [
      { label: "Étudiant", email: "etudiant@demo.iua.local", password: "IuaDemoStudent2026!" },
      { label: "Enseignant", email: "enseignant@demo.iua.local", password: "IuaDemoTeacher2026!" },
      { label: "Secrétariat", email: "secretariat@demo.iua.local", password: "IuaDemoSecret2026!" },
      { label: "Direction", email: "direction@demo.iua.local", password: "IuaDemoDirection2026!" },
      { label: "Admin", email: "admin@demo.iua.local", password: "IuaDemoAdmin2026!" },
    ]
  : [];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(presets[0]?.email || "");
  const [password, setPassword] = useState(presets[0]?.password || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      setChecking(false);
      return;
    }
    const user = getStoredUser();
    if (user?.roles?.length) {
      router.replace(resolveHomePath(user.roles));
      return;
    }
    setChecking(false);
  }, [router]);

  async function finishLogin(
    access: string | undefined,
    refresh: string | undefined,
    user: Parameters<typeof saveSession>[2],
  ) {
    saveSession(access || "", refresh || "", user);
    if (access && refresh) {
      await syncSessionCookies(access, refresh, user.roles);
    }
    router.push(resolveHomePath(user.roles));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mfaToken) {
        const data = await apiMfaVerify(mfaToken, mfaCode);
        await finishLogin(data.access, data.refresh, data.user);
        return;
      }
      const data = await apiLogin(email, password);
      if ("mfa_enrollment_required" in data && data.mfa_enrollment_required) {
        setError(data.message || "Inscription MFA obligatoire pour ce grade.");
        return;
      }
      if ("mfa_required" in data && data.mfa_required) {
        setMfaToken(data.mfa_token);
        setMfaCode("");
        return;
      }
      if ("user" in data && data.user) {
        const full = data as { access?: string; refresh?: string; user: Parameters<typeof saveSession>[2] };
        await finishLogin(full.access, full.refresh, full.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-iua-mist text-iua-navy">
        Vérification de votre session…
      </main>
    );
  }

  return (
    <main className="grid min-h-[100svh] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-iua-navy lg:block">
        <div
          className="absolute inset-0 bg-cover bg-[position:center_18%] opacity-55"
          style={{ backgroundImage: "url('/brand/campus-hero.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-iua-navy via-iua-navy/65 to-iua-navy/35" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <BrandLogo variant="white" priority className="h-12 w-auto" />
          <div className="animate-[fadeUp_0.5s_ease_both]">
            <p className="text-xs uppercase tracking-[0.22em] text-iua-cyan">Portail IUA</p>
            <h1 className="mt-3 max-w-md font-display text-4xl leading-tight">
              Un compte pour vos services
            </h1>
            <p className="mt-4 max-w-sm text-sm text-white/70">
              Étudiants, enseignants et administration se connectent ici, avec un menu adapté
              à chaque rôle. MFA disponible pour les grades sensibles.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center bg-iua-mist px-6 py-12">
        <div className="mx-auto w-full max-w-md animate-[fadeUp_0.4s_ease_both]">
          <Link href="/" className="text-sm text-iua-muted transition hover:text-iua-navy">
            ← Retour à l&apos;accueil
          </Link>
          <div className="mt-8 lg:hidden">
            <BrandLogo className="h-11 w-auto" />
          </div>
          <h2 className="mt-6 font-display text-3xl text-iua-navy">
            {mfaToken ? "Vérification MFA" : "Connexion"}
          </h2>
          <p className="mt-2 text-sm text-iua-muted">
            {mfaToken
              ? "Saisissez le code à 6 chiffres de votre application d'authentification."
              : "Profils de démonstration ou vos identifiants."}
          </p>

          {!mfaToken && presets.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setEmail(p.email);
                    setPassword(p.password);
                    setError(null);
                  }}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                    email === p.email
                      ? "bg-iua-navy text-white"
                      : "bg-white text-iua-navy ring-1 ring-iua-navy/10 hover:bg-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-soft">
            {mfaToken ? (
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-iua-navy">Code TOTP</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full rounded-md border border-iua-navy/15 px-3 py-2.5 tracking-[0.3em] outline-none ring-iua-cyan transition focus:ring-2"
                  placeholder="••••••"
                />
              </label>
            ) : (
              <>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-iua-navy">Email</span>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-iua-navy/15 px-3 py-2.5 outline-none ring-iua-cyan transition focus:ring-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-iua-navy">Mot de passe</span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-iua-navy/15 px-3 py-2.5 outline-none ring-iua-cyan transition focus:ring-2"
                  />
                </label>
              </>
            )}
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-shine w-full rounded-md bg-iua-navy py-3 text-sm font-semibold text-white transition hover:bg-iua-blue disabled:opacity-60"
            >
              {loading ? "…" : mfaToken ? "Valider le code" : "Entrer dans mon espace"}
            </button>
            {mfaToken && (
              <button
                type="button"
                className="w-full text-sm text-iua-muted hover:text-iua-navy"
                onClick={() => {
                  setMfaToken(null);
                  setMfaCode("");
                  setError(null);
                }}
              >
                ← Retour
              </button>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
