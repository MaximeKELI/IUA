"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { apiGetCached } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { studentNav } from "@/lib/navigation";

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

  const { token, ready } = useAuthToken();

  useEffect(() => {
    if (!ready || !token) return;
    apiGetCached<StudentDashboard>("/portal/student/dashboard/", token, 15_000)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Bonjour</p>
          <h1 className="mt-2 font-display text-3xl text-iua-navy">Tableau de bord</h1>
          <p className="mt-2 text-sm text-iua-muted">Vos notes, cours et démarches.</p>
        </div>
      </div>

      {error && <p className="mt-6 text-red-700">{error}</p>}

      {data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Matricule" value={data.profile.student_number || "—"} />
            <Stat label="Formation" value={data.profile.program || "—"} />
            <Stat label="Promotion" value={data.profile.cohort || "—"} />
            <Stat label="Notifications" value={String(data.unread_notifications)} accent />
          </div>

          <section className="mt-10">
            <h2 className="font-display text-xl text-iua-navy">Accès rapides</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Notes", "Moyennes et résultats", "/portail/etudiant/notes"],
                ["Cours", "Matières et inscriptions", "/portail/etudiant/cours"],
                ["Demandes", "Attestations et relevés", "/portail/etudiant/demandes"],
                ["Notifications", "Messages du campus", "/portail/etudiant/notifications"],
              ].map(([title, body, href]) => (
                <Link
                  key={title}
                  href={href}
                  className="rounded-xl border border-iua-navy/10 bg-white p-5 shadow-soft transition hover:border-iua-cyan"
                >
                  <h3 className="font-semibold text-iua-navy">{title}</h3>
                  <p className="mt-1 text-sm text-iua-muted">{body}</p>
                </Link>
              ))}
            </div>
          </section>

        </>
      )}
    </PortalShell>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 ${accent ? "bg-iua-navy text-white" : "bg-white shadow-soft"}`}>
      <p className={`text-xs uppercase tracking-[0.14em] ${accent ? "text-white/60" : "text-iua-muted"}`}>
        {label}
      </p>
      <p className="mt-2 font-display text-xl leading-snug">{value}</p>
    </div>
  );
}
