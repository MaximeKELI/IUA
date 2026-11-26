"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin } from "@/lib/api";
import { resolveHomePath, saveSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("etudiant@demo.iua.local");
  const [password, setPassword] = useState("IuaDemoStudent2026!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="min-h-[100svh] bg-hero-mesh px-6 py-16 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-white/70 transition hover:text-white">
          ← Retour
        </Link>
        <h1 className="mt-8 font-display text-4xl">Connexion</h1>
        <p className="mt-3 text-white/70">
          Identité numérique unique IUA Digital Campus.
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-5 rounded-2xl bg-white/10 p-6 backdrop-blur">
          <label className="block text-sm">
            <span className="mb-2 block text-white/80">Email institutionnel</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none ring-iua-teal focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block text-white/80">Mot de passe</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none ring-iua-teal focus:ring-2"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-iua-teal py-3 font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-xs text-white/50">
          Démo : etudiant@demo.iua.local · enseignant@demo.iua.local · admin@demo.iua.local
        </p>
      </div>
    </main>
  );
}
