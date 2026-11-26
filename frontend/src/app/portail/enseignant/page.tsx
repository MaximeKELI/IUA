"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { teacherNav } from "@/lib/navigation";

type TeacherDashboard = {
  assignments_count: number;
  subjects: { id: string; name: string; code: string }[];
  unread_notifications: number;
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
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Pédagogie</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Votre activité</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Cours, notes et suivi des étudiants regroupés dans un menu unique.
      </p>
      {error && <p className="mt-6 text-red-700">{error}</p>}
      {data && (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">Affectations</p>
              <p className="mt-2 font-display text-3xl text-iua-navy">{data.assignments_count}</p>
            </div>
            <div className="rounded-xl bg-iua-navy p-5 text-white">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">Notifications</p>
              <p className="mt-2 font-display text-3xl">{data.unread_notifications}</p>
            </div>
          </div>
          <section className="rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">Matières enseignées</h2>
            <ul className="mt-4 divide-y divide-iua-navy/10">
              {data.subjects.length === 0 && (
                <li className="py-3 text-sm text-iua-muted">Aucune affectation pour le moment.</li>
              )}
              {data.subjects.map((s) => (
                <li key={s.id} className="flex justify-between py-3 text-sm">
                  <span className="font-medium text-iua-navy">{s.name}</span>
                  <span className="text-iua-muted">{s.code}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </PortalShell>
  );
}
