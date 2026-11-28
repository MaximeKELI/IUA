"use client";

import { useTranslations } from "next-intl";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Insights = {
  subjects: {
    subject_id: string;
    subject_name: string;
    year: string;
    avg_score: number | null;
    students: number;
    graded_students: number;
    coverage_pct: number;
    drafts: number;
  }[];
  kpis: { evaluation_avg: number | null; evaluations_count: number };
};

export default function StatsPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Insights>("/teacher/insights/", token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  return (
    <PortalShell title={tPortal("teacher.space")} nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.teacher.stats")}</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Moyennes par matière, couverture de saisie et comparaison des promotions / années.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {data && (
        <>
          <div className="mt-6 rounded-xl bg-white p-5 shadow-soft">
            <p className="text-sm text-iua-muted">
              Satisfaction enseignement :{" "}
              <strong className="text-iua-navy">
                {data.kpis.evaluation_avg ?? "—"}/5
              </strong>{" "}
              ({data.kpis.evaluations_count} avis)
            </p>
          </div>

          <div className="mt-6 overflow-auto rounded-xl border border-iua-navy/10 bg-white shadow-soft">
            <table className="min-w-full text-sm">
              <thead className="bg-iua-navy text-left text-xs uppercase text-white">
                <tr>
                  <th className="px-4 py-3">Matière</th>
                  <th className="px-4 py-3">Année</th>
                  <th className="px-4 py-3">Moyenne</th>
                  <th className="px-4 py-3">Couverture</th>
                  <th className="px-4 py-3">Brouillons</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((s) => (
                  <tr key={s.subject_id} className="border-t border-iua-navy/10">
                    <td className="px-4 py-3 font-medium text-iua-navy">{s.subject_name}</td>
                    <td className="px-4 py-3 text-iua-muted">{s.year}</td>
                    <td className="px-4 py-3">{s.avg_score ?? "—"}/20</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-iua-mist">
                          <div
                            className="h-full rounded-full bg-iua-cyan"
                            style={{ width: `${Math.min(100, s.coverage_pct)}%` }}
                          />
                        </div>
                        <span>
                          {s.graded_students}/{s.students} ({s.coverage_pct}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{s.drafts}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/portail/enseignant/notes?subject=${s.subject_id}`}
                        className="text-xs font-semibold text-iua-cyan"
                      >
                        Carnet →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PortalShell>
  );
}
