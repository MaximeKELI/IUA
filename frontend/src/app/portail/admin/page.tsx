"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGetCached } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type AdminDashboard = {
  stats: Record<string, number>;
};

const labels: Record<string, string> = {
  users: "Utilisateurs",
  students: "Étudiants",
  faculties: "Facultés",
  programs: "Formations",
  enrollments: "Inscriptions",
};

export default function AdminPortalPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roles = getStoredUser()?.roles || [];

  const { token, ready } = useAuthToken();

  useEffect(() => {
    if (!ready || !token) return;
    apiGetCached<AdminDashboard>("/portal/admin/dashboard/", token, 20_000)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <h1 className="font-display text-3xl text-iua-navy">Vue d&apos;ensemble</h1>
      <p className="mt-2 text-sm text-iua-muted">Effectifs et référentiels de l&apos;établissement.</p>
      {error && <p className="mt-6 text-red-700">{error}</p>}
      {data && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data.stats).map(([key, value]) => (
            <div key={key} className="rounded-xl bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">
                {labels[key] || key}
              </p>
              <p className="mt-2 font-display text-3xl text-iua-navy">{value}</p>
            </div>
          ))}
        </div>
      )}

      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["/portail/admin/utilisateurs", "Autoriser un accès"],
          ["/portail/admin/formations", "Gérer les formations"],
          ["/portail/admin/inscriptions", "Inscrire un étudiant"],
          ["/portail/admin/demandes", "Traiter les demandes"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl bg-iua-navy px-4 py-4 text-sm font-semibold text-white transition hover:bg-iua-blue"
          >
            {label}
          </Link>
        ))}
      </section>
    </PortalShell>
  );
}
