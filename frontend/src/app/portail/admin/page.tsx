"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { adminNav } from "@/lib/navigation";

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

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiGet<AdminDashboard>("/portal/admin/dashboard/", token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  return (
    <PortalShell title="Administration" nav={adminNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Pilotage</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Vue d&apos;ensemble</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Effectifs et référentiels — données issues de l&apos;API centrale.
      </p>
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
    </PortalShell>
  );
}
