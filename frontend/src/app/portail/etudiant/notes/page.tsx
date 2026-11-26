"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { studentNav } from "@/lib/navigation";

type Grade = {
  id: string;
  subject_name: string;
  subject_code: string;
  kind: string;
  label: string;
  score: string;
  max_score: string;
  created_at: string;
};

export default function StudentNotesPage() {
  const { token, ready } = useAuthToken();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Page<Grade>>("/grades/?page_size=100", token)
      .then((data) => setGrades(unwrapList(data)))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Résultats</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Notes & résultats</h1>
      <p className="mt-2 text-sm text-iua-muted">Notes publiées par vos enseignants.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 overflow-auto rounded-xl bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-iua-mist text-xs uppercase tracking-wide text-iua-muted">
            <tr>
              <th className="px-4 py-3">Matière</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-iua-navy/10">
            {grades.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-iua-muted">
                  Aucune note publiée pour le moment.
                </td>
              </tr>
            )}
            {grades.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-iua-navy">{g.subject_name}</p>
                  <p className="text-xs text-iua-muted">{g.subject_code}</p>
                </td>
                <td className="px-4 py-3 text-iua-muted">{g.label || g.kind}</td>
                <td className="px-4 py-3 font-display text-lg text-iua-navy">
                  {g.score}/{g.max_score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
