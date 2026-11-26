"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin } from "@/lib/api";
import { resolveHomePath, saveSession } from "@/lib/auth";
import { motion } from "@/components/motion";

const presets = [
  { label: "Étudiant", email: "etudiant@demo.iua.local", password: "IuaDemoStudent2026!" },
  { label: "Enseignant", email: "enseignant@demo.iua.local", password: "IuaDemoTeacher2026!" },
  { label: "Direction", email: "admin@demo.iua.local", password: "IuaDemoAdmin2026!" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(presets[0].email);
  const [password, setPassword] = useState(presets[0].password);
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
    <main className="grid min-h-[100svh] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-iua-navy lg:block">
        <Image
          src="/brand/campus-hero.jpg"
          alt=""
          fill
          className="hero-kenburns object-cover opacity-45"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-iua-navy via-iua-navy/70 to-iua-navy/40" />
        <div className="glow-orb absolute left-10 top-24 h-40 w-40 rounded-full bg-iua-cyan/30 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Image
              src="/brand/logo-iua.png"
              alt="IUA"
              width={160}
              height={60}
              className="h-12 w-auto brightness-0 invert"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-iua-cyan">Identité unique</p>
            <h1 className="mt-3 max-w-md font-display text-4xl leading-tight">
              Un compte. Tous vos services IUA.
            </h1>
            <p className="mt-4 max-w-sm text-sm text-white/70">
              Étudiants, enseignants et administration accèdent au même Digital Campus,
              avec des menus adaptés à leur rôle.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="flex items-center bg-iua-mist px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="mx-auto w-full max-w-md"
        >
          <Link href="/" className="text-sm text-iua-muted transition hover:text-iua-navy">
            ← Retour à l&apos;accueil
          </Link>
          <div className="mt-8 lg:hidden">
            <Image src="/brand/logo-iua.png" alt="IUA" width={140} height={52} className="h-10 w-auto" />
          </div>
          <h2 className="mt-6 font-display text-3xl text-iua-navy">Connexion</h2>
          <p className="mt-2 text-sm text-iua-muted">
            Choisissez votre profil de démonstration, ou saisissez vos identifiants.
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-iua-navy/15 px-3 py-2.5 outline-none ring-iua-cyan transition focus:ring-2"
              />
            </label>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </motion.p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-shine w-full rounded-md bg-iua-navy py-3 text-sm font-semibold text-white transition hover:bg-iua-blue disabled:opacity-60"
            >
              {loading ? "Connexion…" : "Entrer dans mon espace"}
            </button>
          </form>
        </motion.div>
      </section>
    </main>
  );
}
