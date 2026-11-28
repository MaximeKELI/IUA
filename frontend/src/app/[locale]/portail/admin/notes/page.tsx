"use client";

import { useTranslations } from "next-intl";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, Page, unwrapList } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  canEditGrades,
  canSeeStudentIds,
  resolveOpsNav,
  resolveOpsTitle,
} from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type Grade = {
  id: string;
  subject_name?: string;
  subject_code?: string;
  student_name?: string;
  student_number?: string | null;
  kind: string;
  label: string;
  score: string | number;
  max_score: string | number;
  is_published: boolean;
  created_at: string;
};

export default function AdminNotesConsultPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];
  const showIds = canSeeStudentIds(roles);
  const editable = canEditGrades(roles);
  const [items, setItems] = useState<Grade[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Page<Grade>>("/grades/?page_size=100", token)
      .then((data) => setItems(unwrapList(data)))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Pédagogie</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">{tPortal("pages.admin.notes")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">
        {editable
          ? "Notes déjà saisies. La saisie se fait dans l'espace enseignant."
          : "Consultation uniquement. La saisie reste réservée aux enseignants."}
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <section className="mt-8 overflow-hidden rounded-xl bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-iua-mist text-xs uppercase tracking-wide text-iua-muted">
            <tr>
              <th className="px-4 py-3">Étudiant</th>
              {showIds && <th className="px-4 py-3">Matricule</th>}
              <th className="px-4 py-3">Matière</th>
              <th className="px-4 py-3">Éval.</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-iua-navy/10">
            {items.length === 0 && (
              <tr>
                <td colSpan={showIds ? 6 : 5} className="px-4 py-6 text-iua-muted">
                  Aucune note publiée ou saisie pour le moment.
                </td>
              </tr>
            )}
            {items.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3 font-medium text-iua-navy">{g.student_name || "—"}</td>
                {showIds && (
                  <td className="px-4 py-3 text-iua-muted">{g.student_number || "—"}</td>
                )}
                <td className="px-4 py-3">
                  <span className="font-medium">{g.subject_code}</span>
                  <span className="block text-xs text-iua-muted">{g.subject_name}</span>
                </td>
                <td className="px-4 py-3">
                  {g.label || g.kind}
                </td>
                <td className="px-4 py-3 font-semibold text-iua-navy">
                  {g.score}/{g.max_score}
                </td>
                <td className="px-4 py-3 text-xs uppercase text-iua-muted">
                  {g.is_published ? "Publiée" : "Brouillon"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PortalShell>
  );
}
