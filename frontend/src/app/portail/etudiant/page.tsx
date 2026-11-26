"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type StudentDashboard = {
  role: string;
  profile: {
    student_number: string | null;
    program: string | null;
    cohort: string | null;
    level: string | null;
  };
  enrollments_count: number;
  unread_notifications: number;
  modules: { code: string; name: string; status: string }[];
};

export default function StudentPortalPage() {
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiGet<StudentDashboard>("/portal/student/dashboard/", token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  return (
    <PortalShell title="Portail étudiant">
      <h1 className="font-display text-3xl text-iua-navy">Mon espace</h1>
      <p className="mt-2 text-iua-ink/65">Tableau de bord personnalisé — données API réelles.</p>

      {error && <p className="mt-6 text-red-700">{error}</p>}

      {data && (
        <>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Stat label="Matricule" value={data.profile.student_number || "—"} />
            <Stat label="Formation" value={data.profile.program || "—"} />
            <Stat label="Notifications" value={String(data.unread_notifications)} />
          </div>
          <section className="mt-12">
            <h2 className="font-display text-xl text-iua-navy">Services</h2>
            <ul className="mt-4 divide-y divide-iua-navy/10 border-y border-iua-navy/10">
              {data.modules.map((m) => (
                <li key={m.code} className="flex items-center justify-between py-4 text-sm">
                  <span>
                    <span className="mr-3 text-iua-navy/40">{m.code}</span>
                    {m.name}
                  </span>
                  <span
                    className={
                      m.status === "active" ? "text-iua-teal" : "text-iua-navy/40"
                    }
                  >
                    {m.status === "active" ? "Actif" : "À venir"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </PortalShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-iua-navy/15 pt-4">
      <p className="text-xs uppercase tracking-[0.14em] text-iua-navy/45">{label}</p>
      <p className="mt-2 font-display text-2xl text-iua-navy">{value}</p>
    </div>
  );
}
