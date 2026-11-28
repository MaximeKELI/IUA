"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { apiLogin } from "@/lib/api";
import { getAccessToken, getStoredUser, resolveHomePath, saveSession } from "@/lib/auth";

const presets = [
  { label: "Étudiant", email: "etudiant@demo.iua.local", password: "IuaDemoStudent2026!" },
  { label: "Enseignant", email: "enseignant@demo.iua.local", password: "IuaDemoTeacher2026!" },
  { label: "Secrétariat", email: "secretariat@demo.iua.local", password: "IuaDemoSecret2026!" },
  { label: "Direction", email: "direction@demo.iua.local", password: "IuaDemoDirection2026!" },
  { label: "Admin", email: "admin@demo.iua.local", password: "IuaDemoAdmin2026!" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(presets[0].email);
  const [password, setPassword] = useState(presets[0].password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin(email, password);
      saveSession(data.access, data.refresh, data.user);
      router.push(resolveHomePath(data.user.roles));
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
              à chaque rôle.
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
          <h2 className="mt-6 font-display text-3xl text-iua-navy">Connexion</h2>
          <p className="mt-2 text-sm text-iua-muted">
            Profils de démonstration ou vos identifiants.
          </p>

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

          <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-soft">
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
              {loading ? "Connexion…" : "Entrer dans mon espace"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
