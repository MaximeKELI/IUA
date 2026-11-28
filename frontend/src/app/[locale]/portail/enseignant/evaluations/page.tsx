"use client";

import { useTranslations } from "next-intl";

import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useTeacherAssignments } from "@/lib/teacher";

type Evaluation = {
  id: string;
  subject_name?: string;
  clarity: number;
  usefulness: number;
  pacing: number;
  overall: number;
  comment: string;
  is_anonymous: boolean;
  created_at: string;
};

export default function EvaluationsPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useTeacherAssignments();
  const [items, setItems] = useState<Evaluation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Page<Evaluation>>("/teaching-evaluations/?page_size=100", token)
      .then((data) => setItems(unwrapList(data)))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  const averages = useMemo(() => {
    if (!items.length) return null;
    const sum = items.reduce(
      (acc, e) => ({
        clarity: acc.clarity + e.clarity,
        usefulness: acc.usefulness + e.usefulness,
        pacing: acc.pacing + e.pacing,
        overall: acc.overall + e.overall,
      }),
      { clarity: 0, usefulness: 0, pacing: 0, overall: 0 },
    );
    const n = items.length;
    return {
      clarity: (sum.clarity / n).toFixed(1),
      usefulness: (sum.usefulness / n).toFixed(1),
      pacing: (sum.pacing / n).toFixed(1),
      overall: (sum.overall / n).toFixed(1),
    };
  }, [items]);

  return (
    <PortalShell title={tPortal("teacher.space")} nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.teacher.evaluations")}</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Retours étudiants (anonymes possibles) sur clarté, utilité, rythme et satisfaction globale.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {averages && (
        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {[
            ["Clarté", averages.clarity],
            ["Utilité", averages.usefulness],
            ["Rythme", averages.pacing],
            ["Global", averages.overall],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.14em] text-iua-muted">{label}</p>
              <p className="mt-2 font-display text-3xl text-iua-navy">{value}/5</p>
            </div>
          ))}
        </div>
      )}

      <ul className="mt-8 space-y-3">
        {items.length === 0 && (
          <li className="rounded-xl bg-white p-5 text-sm text-iua-muted shadow-soft">
            Aucune évaluation reçue pour le moment.
          </li>
        )}
        {items.map((e) => (
          <li key={e.id} className="rounded-xl bg-white p-5 shadow-soft">
            <div className="flex justify-between gap-3 text-sm">
              <p className="font-medium text-iua-navy">{e.subject_name || "Cours"}</p>
              <p className="text-iua-muted">
                {e.overall}/5 · {e.is_anonymous ? "Anonyme" : "Nominatif"}
              </p>
            </div>
            <p className="mt-2 text-xs text-iua-muted">
              Clarté {e.clarity} · Utilité {e.usefulness} · Rythme {e.pacing}
            </p>
            {e.comment && <p className="mt-3 text-sm text-iua-muted">“{e.comment}”</p>}
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
