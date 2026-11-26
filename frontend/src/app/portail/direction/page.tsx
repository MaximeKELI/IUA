"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type DirectionDashboard = {
  kpis: Record<string, number>;
  students_by_faculty: { faculty: string; total: number }[];
  note: string;
};

export default function DirectionPortalPage() {
  const [data, setData] = useState<DirectionDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiGet<DirectionDashboard>("/portal/direction/dashboard/", token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  return (
    <PortalShell title="Direction">
      <h1 className="font-display text-3xl text-iua-navy">Tableau de bord direction</h1>
      <p className="mt-2 text-iua-ink/65">Vision globale de l&apos;établissement.</p>
      {error && <p className="mt-6 text-red-700">{error}</p>}
      {data && (
        <>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.kpis).map(([key, value]) => (
              <div key={key} className="border-t border-iua-navy/15 pt-4">
                <p className="text-xs uppercase tracking-[0.14em] text-iua-navy/45">{key}</p>
                <p className="mt-2 font-display text-3xl text-iua-navy">{value}</p>
              </div>
            ))}
          </div>
          <section className="mt-12">
            <h2 className="font-display text-xl text-iua-navy">Effectifs par faculté</h2>
            <ul className="mt-4 divide-y divide-iua-navy/10 border-y border-iua-navy/10">
              {data.students_by_faculty.map((row) => (
                <li key={row.faculty} className="flex justify-between py-4 text-sm">
                  <span>{row.faculty}</span>
                  <span className="font-medium text-iua-navy">{row.total}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-iua-navy/50">{data.note}</p>
          </section>
        </>
      )}
    </PortalShell>
  );
}
