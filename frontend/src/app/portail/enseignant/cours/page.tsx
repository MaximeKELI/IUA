"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { teacherNav } from "@/lib/navigation";

type Assignment = {
  id: string;
  subject: string;
  subject_name: string;
  subject_code: string;
  academic_year: string;
};

export default function TeacherCoursPage() {
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Page<Assignment>>("/teaching-assignments/?page_size=100", token)
      .then((data) => setItems(unwrapList(data)))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Pédagogie</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Mes cours</h1>
      <p className="mt-2 text-sm text-iua-muted">Affectations enseignement pour l&apos;année en cours.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <ul className="mt-8 divide-y divide-iua-navy/10 rounded-xl bg-white shadow-soft">
        {items.length === 0 && <li className="p-5 text-sm text-iua-muted">Aucune affectation.</li>}
        {items.map((a) => (
          <li key={a.id} className="flex items-center justify-between px-5 py-4 text-sm">
            <div>
              <p className="font-medium text-iua-navy">{a.subject_name}</p>
              <p className="text-xs text-iua-muted">{a.subject_code}</p>
            </div>
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
