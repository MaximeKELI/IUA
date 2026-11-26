"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type TeacherDashboard = {
  assignments_count: number;
  subjects: { id: string; name: string; code: string }[];
  unread_notifications: number;
  modules: { code: string; name: string; status: string }[];
};

export default function TeacherPortalPage() {
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiGet<TeacherDashboard>("/portal/teacher/dashboard/", token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  return (
    <PortalShell title="Portail enseignant">
      <h1 className="font-display text-3xl text-iua-navy">Espace enseignant</h1>
      <p className="mt-2 text-iua-ink/65">Matières, promotions et outils pédagogiques.</p>
      {error && <p className="mt-6 text-red-700">{error}</p>}
      {data && (
        <div className="mt-10 space-y-10">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="border-t border-iua-navy/15 pt-4">
              <p className="text-xs uppercase tracking-[0.14em] text-iua-navy/45">Affectations</p>
              <p className="mt-2 font-display text-3xl text-iua-navy">{data.assignments_count}</p>
            </div>
            <div className="border-t border-iua-navy/15 pt-4">
              <p className="text-xs uppercase tracking-[0.14em] text-iua-navy/45">Notifications</p>
              <p className="mt-2 font-display text-3xl text-iua-navy">{data.unread_notifications}</p>
            </div>
          </div>
          <section>
            <h2 className="font-display text-xl text-iua-navy">Matières enseignées</h2>
            <ul className="mt-4 divide-y divide-iua-navy/10 border-y border-iua-navy/10">
              {data.subjects.length === 0 && (
                <li className="py-4 text-sm text-iua-navy/50">Aucune affectation pour le moment.</li>
              )}
              {data.subjects.map((s) => (
                <li key={s.id} className="flex justify-between py-4 text-sm">
                  <span>{s.name}</span>
                  <span className="text-iua-navy/40">{s.code}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </PortalShell>
  );
}
