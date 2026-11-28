"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useTeacherAssignments } from "@/lib/teacher";

type FilePayload = {
  student: {
    id: string;
    full_name: string;
    student_number: string | null;
    program: string | null;
    email: string;
  };
  avg_score: number | null;
  alerts: string[];
  grades: {
    id: string;
    subject: string;
    kind: string;
    label: string;
    score: string | null;
    max_score: string;
    entry_status: string;
    comment: string;
  }[];
  attendance: { date: string; subject: string; status: string; comment: string }[];
};

export default function FicheEtudiantPage() {
  const { token, ready, students } = useTeacherAssignments();
  const [studentId, setStudentId] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<FilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 40);
    return students
      .filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          (s.student_number || "").toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [students, query]);

  useEffect(() => {
    if (!ready || !token || !studentId) {
      setData(null);
      return;
    }
    apiGet<FilePayload>(`/teacher/students/${studentId}/file/`, token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token, studentId]);

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Fiche pédagogique étudiant</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Historique des notes, absences et alertes pédagogiques pour un suivi individualisé.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl bg-white p-4 shadow-soft">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="mb-3 w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          />
          <ul className="max-h-[28rem] space-y-1 overflow-auto text-sm">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStudentId(s.id)}
                  className={`w-full rounded-md px-3 py-2 text-left ${
                    studentId === s.id ? "bg-iua-navy text-white" : "hover:bg-iua-mist"
                  }`}
                >
                  <span className="block font-medium">{s.full_name}</span>
                  <span className="block text-[11px] opacity-70">{s.student_number}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          {!data && <p className="text-sm text-iua-muted">Sélectionnez un étudiant.</p>}
          {data && (
            <>
              <h2 className="font-display text-2xl text-iua-navy">{data.student.full_name}</h2>
              <p className="text-sm text-iua-muted">
                {data.student.student_number} · {data.student.program || "Programme —"} ·{" "}
                {data.student.email}
              </p>
              <p className="mt-3 text-sm">
                Moyenne suivie :{" "}
                <strong className="text-iua-navy">
                  {data.avg_score !== null ? `${data.avg_score}/20` : "—"}
                </strong>
              </p>
              {data.alerts.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {data.alerts.map((a) => (
                    <li key={a} className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      {a}
                    </li>
                  ))}
                </ul>
              )}
              <h3 className="mt-6 font-display text-lg text-iua-navy">Notes</h3>
              <ul className="mt-2 divide-y divide-iua-navy/10 text-sm">
                {data.grades.map((g) => (
                  <li key={g.id} className="flex justify-between gap-3 py-2">
                    <div>
                      <p className="font-medium text-iua-navy">
                        {g.subject} · {g.label || g.kind}
                      </p>
                      {g.comment && <p className="text-xs text-iua-muted">{g.comment}</p>}
                    </div>
                    <p>
                      {g.entry_status !== "scored"
                        ? g.entry_status
                        : `${g.score}/${g.max_score}`}
                    </p>
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 font-display text-lg text-iua-navy">Absences / retards</h3>
              <ul className="mt-2 divide-y divide-iua-navy/10 text-sm">
                {data.attendance.length === 0 && (
                  <li className="py-2 text-iua-muted">Aucune anomalie récente.</li>
                )}
                {data.attendance.map((a, i) => (
                  <li key={`${a.date}-${i}`} className="flex justify-between py-2">
                    <span>
                      {a.date} · {a.subject}
                    </span>
                    <span className="uppercase text-iua-muted">{a.status}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
