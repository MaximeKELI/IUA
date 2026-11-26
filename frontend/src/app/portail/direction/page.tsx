"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGetCached } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type DirectionDashboard = {
  kpis: Record<string, number>;
  students_by_faculty: { faculty: string; total: number }[];
  recent_requests?: {
    id: string;
    subject: string;
    status: string;
    kind: string;
    requester: string;
  }[];
  capabilities?: Record<string, boolean>;
  note: string;
};

const labels: Record<string, string> = {
  students: "Étudiants",
  teachers: "Enseignants",
  faculties: "Facultés",
  programs: "Formations",
  enrollments: "Inscriptions",
  pending_requests: "Demandes en attente",
  grades_published: "Notes publiées",
  teaching_assignments: "Affectations cours",
};

const manageLinks = [
  {
    href: "/portail/admin/utilisateurs",
    title: "Utilisateurs & rôles",
    body: "Créer, autoriser et désactiver les comptes.",
  },
  {
    href: "/portail/admin/formations",
    title: "Formations",
    body: "Facultés, programmes, UE et matières.",
  },
  {
    href: "/portail/admin/inscriptions",
    title: "Inscriptions",
    body: "Affecter les étudiants aux promotions.",
  },
  {
    href: "/portail/admin/demandes",
    title: "Demandes administratives",
    body: "Traiter attestations, relevés et certificats.",
  },
];

const consultLinks = [
  {
    href: "/portail/admin/enseignements",
    title: "Cours & affectations",
    body: "Consultation seule — modification réservée au secrétariat / scolarité.",
  },
  {
    href: "/portail/admin/notes",
    title: "Notes des enseignants",
    body: "Consultation seule — saisie réservée aux enseignants.",
  },
];

export default function DirectionPortalPage() {
  const [data, setData] = useState<DirectionDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roles = getStoredUser()?.roles || [];
  const { token, ready } = useAuthToken();

  useEffect(() => {
    if (!ready || !token) return;
    apiGetCached<DirectionDashboard>("/portal/direction/dashboard/", token, 15_000)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Gouvernance</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Tableau de bord direction</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">
        Pilotage de l&apos;établissement : vous gérez utilisateurs, formations, inscriptions et
        demandes. Les matricules étudiants sont masqués ; cours et notes enseignants restent en
        consultation.
      </p>
      {error && <p className="mt-6 text-red-700">{error}</p>}
      {data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.kpis).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-white p-5 shadow-soft">
                <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">
                  {labels[key] || key}
                </p>
                <p className="mt-2 font-display text-3xl text-iua-navy">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl bg-white p-5 shadow-soft">
              <h2 className="font-display text-xl text-iua-navy">Actions de gestion</h2>
              <ul className="mt-4 space-y-3">
                {manageLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block rounded-md border border-iua-navy/10 px-4 py-3 transition hover:border-iua-cyan/40 hover:bg-iua-mist/60"
                    >
                      <p className="font-semibold text-iua-navy">{link.title}</p>
                      <p className="mt-1 text-xs text-iua-muted">{link.body}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-soft">
              <h2 className="font-display text-xl text-iua-navy">Consultation (lecture seule)</h2>
              <ul className="mt-4 space-y-3">
                {consultLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block rounded-md border border-dashed border-iua-navy/15 px-4 py-3 transition hover:bg-iua-mist/60"
                    >
                      <p className="font-semibold text-iua-navy">{link.title}</p>
                      <p className="mt-1 text-xs text-iua-muted">{link.body}</p>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-md bg-iua-mist px-4 py-3 text-xs text-iua-muted">
                {data.note}
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl bg-white p-5 shadow-soft">
              <h2 className="font-display text-xl text-iua-navy">Effectifs par faculté</h2>
              <ul className="mt-4 divide-y divide-iua-navy/10">
                {data.students_by_faculty.length === 0 && (
                  <li className="py-3 text-sm text-iua-muted">Aucun effectif.</li>
                )}
                {data.students_by_faculty.map((row) => (
                  <li key={row.faculty} className="flex justify-between py-3 text-sm">
                    <span>{row.faculty}</span>
                    <span className="font-semibold text-iua-navy">{row.total}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-iua-navy">Demandes récentes</h2>
                <Link
                  href="/portail/admin/demandes"
                  className="text-xs font-semibold text-iua-cyan hover:underline"
                >
                  Tout traiter →
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
                {(data.recent_requests || []).length === 0 && (
                  <li className="py-3 text-iua-muted">Aucune demande.</li>
                )}
                {(data.recent_requests || []).map((req) => (
                  <li key={req.id} className="py-3">
                    <div className="flex justify-between gap-2">
                      <p className="font-medium text-iua-navy">{req.subject}</p>
                      <span className="text-xs uppercase text-iua-muted">{req.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-iua-muted">
                      {req.requester} · {req.kind}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </PortalShell>
  );
}
