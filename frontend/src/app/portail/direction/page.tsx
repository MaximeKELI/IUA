"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGetCached } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { adminNav } from "@/lib/navigation";

type DirectionDashboard = {
  kpis: Record<string, number>;
  students_by_faculty: { faculty: string; total: number }[];
  note: string;
};

const labels: Record<string, string> = {
  students: "Étudiants",
  teachers: "Enseignants",
  faculties: "Facultés",
  programs: "Formations",
  enrollments: "Inscriptions",
};

export default function DirectionPortalPage() {
  const [data, setData] = useState<DirectionDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { token, ready } = useAuthToken();

  useEffect(() => {
    if (!ready || !token) return;
    apiGetCached<DirectionDashboard>("/portal/direction/dashboard/", token, 20_000)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title="Direction" nav={adminNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Gouvernance</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Tableau de bord direction</h1>
      <p className="mt-2 text-sm text-iua-muted">Vision consolidée de l&apos;établissement.</p>
      {error && <p className="mt-6 text-red-700">{error}</p>}
      {data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.kpis).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-white p-5 shadow-soft">
                <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">
                  {labels[key] || key}
                </p>
                <p className="mt-2 font-display text-3xl text-iua-navy">{value}</p>
              </div>
            ))}
          </div>
          <section className="mt-8 rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">Effectifs par faculté</h2>
            <ul className="mt-4 divide-y divide-iua-navy/10">
              {data.students_by_faculty.map((row) => (
                <li key={row.faculty} className="flex justify-between py-3 text-sm">
                  <span>{row.faculty}</span>
                  <span className="font-semibold text-iua-navy">{row.total}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-iua-muted">{data.note}</p>
          </section>
        </>
      )}
    </PortalShell>
  );
}
