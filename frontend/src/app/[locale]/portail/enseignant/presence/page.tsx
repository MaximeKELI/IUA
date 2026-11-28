"use client";

import { useTranslations } from "next-intl";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { studentsForAssignment, useTeacherAssignments } from "@/lib/teacher";

type Session = { id: string; subject: string; academic_year: string; session_date: string; topic: string; room: string; present_count?: number; absent_count?: number };
type Status = "present" | "absent" | "late" | "excused";

export default function PresencePage() {
  const tPortal = useTranslations("portal");

  const { token, ready, assignments, students } = useTeacherAssignments();
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [topic, setTopic] = useState("");
  const [room, setRoom] = useState("");
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [sessions, setSessions] = useState<Session[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assignment = assignments.find((a) => a.subject === subjectId);
  const roster = useMemo(() => studentsForAssignment(students, assignment), [students, assignment]);

  useEffect(() => {
    if (!subjectId && assignments[0]) setSubjectId(assignments[0].subject);
  }, [assignments, subjectId]);

  useEffect(() => {
    const init: Record<string, Status> = {};
    for (const s of roster) init[s.id] = marks[s.id] || "present";
    setMarks(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster.map((s) => s.id).join(",")]);

  async function reloadSessions() {
    if (!token || !subjectId) return;
    const data = await apiGet<Page<Session>>(`/attendance-sessions/?subject=${subjectId}&page_size=50`, token);
    setSessions(unwrapList(data));
  }

  useEffect(() => {
    if (ready && token && subjectId) void reloadSessions().catch((e) => setError(String(e.message || e)));
  }, [ready, token, subjectId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !assignment) return;
    setError(null); setMsg(null);
    try {
      const session = await apiSend<Session>("/attendance-sessions/", token, "POST", {
        subject: subjectId,
        academic_year: assignment.academic_year,
        session_date: date,
        topic,
        room,
      });
      await apiSend(`/attendance-sessions/${session.id}/bulk_records/`, token, "POST", {
        records: Object.entries(marks).map(([student, status]) => ({ student, status })),
      });
      clearApiMemoryCache();
      setMsg("Émargement enregistré.");
      await reloadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title={tPortal("teacher.space")} nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.teacher.presence")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Marquez présents, absents, retards ou excusés pour chaque séance.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl bg-white p-5 shadow-soft">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-iua-muted">Matière</span>
            <select required value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full rounded-md border border-iua-navy/15 px-3 py-2">
              {assignments.map((a) => <option key={a.id} value={a.subject}>{a.subject_name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-iua-muted">Date</span>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border border-iua-navy/15 px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-iua-muted">Salle</span>
            <input value={room} onChange={(e) => setRoom(e.target.value)} className="w-full rounded-md border border-iua-navy/15 px-3 py-2" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-iua-muted">Thème de séance</span>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full rounded-md border border-iua-navy/15 px-3 py-2" placeholder="Ex. Chapitre 3 — fonctions" />
        </label>
        <div className="overflow-auto rounded-md border border-iua-navy/10">
          <table className="w-full text-sm">
            <thead className="bg-iua-mist text-xs uppercase text-iua-muted"><tr><th className="px-3 py-2 text-left">Étudiant</th><th className="px-3 py-2">Statut</th></tr></thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.id} className="border-t border-iua-navy/10">
                  <td className="px-3 py-2"><p className="font-medium text-iua-navy">{s.full_name}</p><p className="text-[11px] text-iua-muted">{s.student_number}</p></td>
                  <td className="px-3 py-2">
                    <select value={marks[s.id] || "present"} onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value as Status }))} className="rounded-md border border-iua-navy/15 px-2 py-1.5">
                      <option value="present">Présent</option>
                      <option value="late">Retard</option>
                      <option value="absent">Absent</option>
                      <option value="excused">Excusé</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="submit" className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white">Valider l&apos;émargement</button>
      </form>
      <section className="mt-8 rounded-xl bg-white p-5 shadow-soft">
        <h2 className="font-display text-xl text-iua-navy">Séances récentes</h2>
        <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
          {sessions.length === 0 && <li className="py-3 text-iua-muted">Aucune séance.</li>}
          {sessions.map((s) => (
            <li key={s.id} className="flex justify-between gap-3 py-3">
              <div><p className="font-medium text-iua-navy">{s.session_date} · {s.topic || "Séance"}</p><p className="text-xs text-iua-muted">{s.room || "—"}</p></div>
              <p className="text-xs text-iua-muted">{s.present_count ?? 0} prés. · {s.absent_count ?? 0} abs.</p>
            </li>
          ))}
        </ul>
      </section>
    </PortalShell>
  );
}
