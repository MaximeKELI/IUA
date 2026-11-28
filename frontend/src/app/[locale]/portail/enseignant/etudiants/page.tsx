"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { teacherNav } from "@/lib/navigation";

type Student = {
  id: string;
  student_number: string | null;
  full_name: string;
  email: string;
  program: string | null;
  level: string;
  status: string;
};

type Program = { id: string; name: string; code: string };

type Grade = {
  id: string;
  student: string;
  subject: string;
  subject_name: string;
};

type Assignment = {
  id: string;
  subject: string;
  subject_name: string;
  program_id?: string;
};

const statusLabel: Record<string, string> = {
  active: "Actif",
  suspended: "Suspendu",
  graduated: "Diplômé",
  withdrawn: "Retiré",
};

function TeacherStudentsInner() {
  const { token, ready } = useAuthToken();
  const search = useSearchParams();
  const programFilter = search.get("program") || "";
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [programId, setProgramId] = useState(programFilter);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    Promise.all([
      apiGet<Page<Student>>("/students/?page_size=200", token),
      apiGet<Page<Program>>("/programs/?page_size=100", token),
      apiGet<Page<Grade>>("/grades/?page_size=200", token),
      apiGet<Page<Assignment>>("/teaching-assignments/?page_size=100", token),
    ])
      .then(([s, p, g, a]) => {
        setStudents(unwrapList(s));
        setPrograms(unwrapList(p));
        setGrades(unwrapList(g));
        setAssignments(unwrapList(a));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  useEffect(() => {
    if (programFilter) setProgramId(programFilter);
  }, [programFilter]);

  const gradesByStudent = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of grades) {
      map.set(g.student, (map.get(g.student) || 0) + 1);
    }
    return map;
  }, [grades]);

  const programsFromAssignments = useMemo(() => {
    const ids = new Set(assignments.map((a) => a.program_id).filter(Boolean) as string[]);
    if (ids.size === 0) return programs;
    return programs.filter((p) => ids.has(p.id));
  }, [programs, assignments]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return students.filter((s) => {
      if (programId && s.program !== programId) return false;
      if (!needle) return true;
      return (
        s.full_name.toLowerCase().includes(needle) ||
        (s.student_number || "").toLowerCase().includes(needle) ||
        s.email.toLowerCase().includes(needle)
      );
    });
  }, [students, programId, q]);

  const programName = (id: string | null) =>
    programs.find((p) => p.id === id)?.name || "Non affecté";

  const defaultSubjectForProgram = (program: string | null) => {
    if (!program) return assignments[0]?.subject;
    return assignments.find((a) => a.program_id === program)?.subject || assignments[0]?.subject;
  };

  return (
    <>
      <h1 className="font-display text-3xl text-iua-navy">Mes étudiants</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Étudiants des formations liées à vos matières.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un nom ou matricule…"
          className="min-w-[14rem] flex-1 rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <select
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        >
          <option value="">Toutes les formations</option>
          {programsFromAssignments.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} {p.name}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-xs text-iua-muted">
        {filtered.length} étudiant{filtered.length > 1 ? "s" : ""}
        {programId || q ? " (filtre actif)" : ""}
      </p>

      <section className="mt-4 overflow-hidden rounded-xl bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-iua-mist text-xs uppercase tracking-wide text-iua-muted">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Matricule</th>
              <th className="px-4 py-3">Formation</th>
              <th className="px-4 py-3">Niveau</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-iua-navy/10">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-iua-muted">
                  Aucun étudiant trouvé.
                </td>
              </tr>
            )}
            {filtered.map((s) => {
              const noteCount = gradesByStudent.get(s.id) || 0;
              const subject = defaultSubjectForProgram(s.program);
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-iua-navy">{s.full_name}</p>
                    <p className="text-xs text-iua-muted">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-iua-muted">{s.student_number || "—"}</td>
                  <td className="px-4 py-3">{programName(s.program)}</td>
                  <td className="px-4 py-3">{s.level || "—"}</td>
                  <td className="px-4 py-3 text-iua-muted">{noteCount}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-iua-mist px-2 py-0.5 text-[11px] font-medium text-iua-navy">
                      {statusLabel[s.status] || s.status || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Link
                        href={`/portail/enseignant/notes?student=${s.id}${
                          subject ? `&subject=${subject}` : ""
                        }`}
                        className="text-xs font-semibold text-iua-cyan"
                      >
                        Noter
                      </Link>
                      {noteCount > 0 && (
                        <Link
                          href={`/portail/enseignant/notes?student=${s.id}${
                            subject ? `&subject=${subject}` : ""
                          }`}
                          className="text-[11px] text-iua-muted hover:text-iua-navy"
                        >
                          Voir notes
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default function TeacherStudentsPage() {
  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <Suspense fallback={<p className="text-sm text-iua-muted">Chargement…</p>}>
        <TeacherStudentsInner />
      </Suspense>
    </PortalShell>
  );
}
