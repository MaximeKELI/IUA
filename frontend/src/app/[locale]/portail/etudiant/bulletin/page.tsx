"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { appreciationFor } from "@/lib/grades";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Grade = {
  id: string;
  subject_name: string;
  subject_code?: string;
  kind: string;
  label: string;
  score: string | null;
  max_score: string;
  entry_status?: string;
  is_published: boolean;
};

export default function BulletinPage() {
  const { token, ready } = useAuthToken();
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Page<Grade>>("/grades/?page_size=200", token).then((d) =>
      setGrades(unwrapList(d).filter((g) => g.is_published)),
    );
  }, [ready, token]);

  const bySubject = new Map<string, Grade[]>();
  for (const g of grades) {
    const key = g.subject_name;
    bySubject.set(key, [...(bySubject.get(key) || []), g]);
  }

  function exportPdf() {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = [...bySubject.entries()]
      .map(([subject, list]) => {
        const cells: Record<string, { score: number; max: number }> = {};
        list.forEach((g, i) => {
          if (g.score != null && g.entry_status !== "absent") {
            cells[`c${i}`] = { score: Number(g.score), max: Number(g.max_score || 20) };
          }
        });
        // simple average of scores on /20
        const vals = Object.values(cells).map((c) => (c.score / c.max) * 20);
        const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null;
        const appr = appreciationFor(avg);
        return `<tr><td style="padding:8px;border:1px solid #ccc">${subject}</td><td style="padding:8px;border:1px solid #ccc;text-align:center">${avg ?? "—"}</td><td style="padding:8px;border:1px solid #ccc;text-align:center">${appr.label}</td></tr>`;
      })
      .join("");
    win.document.write(
      `<!doctype html><html><head><title>Bulletin IUA</title></head><body style="font-family:system-ui;padding:24px"><h1>Bulletin de notes — IUA</h1><p>${new Date().toLocaleString("fr-FR")}</p><table style="border-collapse:collapse;width:100%"><thead><tr><th>Matière</th><th>Moyenne</th><th>Appréciation</th></tr></thead><tbody>${rows}</tbody></table><script>window.print()</script></body></html>`,
    );
    win.document.close();
  }

  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-iua-navy">Bulletin / export</h1>
          <p className="mt-2 text-sm text-iua-muted">
            Synthèse des notes publiées avec export PDF imprimable (FR).
          </p>
        </div>
        <button
          type="button"
          onClick={exportPdf}
          className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white"
        >
          Exporter PDF
        </button>
      </div>

      <div className="mt-8 space-y-4">
        {[...bySubject.entries()].map(([subject, list]) => {
          const vals = list
            .filter((g) => g.score != null && Number(g.max_score) > 0)
            .map((g) => (Number(g.score) / Number(g.max_score)) * 20);
          const avg = vals.length
            ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
            : null;
          const appr = appreciationFor(avg);
          return (
            <section key={subject} className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl text-iua-navy">{subject}</h2>
                <p className="text-sm">
                  Moy. <strong>{avg ?? "—"}/20</strong> · {appr.label}
                </p>
              </div>
              <ul className="mt-3 divide-y divide-iua-navy/10 text-sm">
                {list.map((g) => (
                  <li key={g.id} className="flex justify-between py-2">
                    <span>{g.label || g.kind}</span>
                    <span>
                      {g.score != null ? `${g.score}/${g.max_score}` : g.entry_status || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {bySubject.size === 0 && <p className="text-sm text-iua-muted">Aucune note publiée.</p>}
      </div>
    </PortalShell>
  );
}
