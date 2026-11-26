"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { adminNav } from "@/lib/navigation";

type Student = { id: string; student_number: string; full_name: string; email: string; program: string | null };
type Program = { id: string; name: string; code: string };
type Cohort = { id: string; name: string; code: string; program: string; academic_year: string };
type Year = { id: string; name: string; code: string; is_current: boolean };
type Enrollment = {
  id: string;
  student: string;
  program: string;
  cohort: string;
  academic_year: string;
  status: string;
};

export default function AdminInscriptionsPage() {
  const { token, ready } = useAuthToken();
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState({
    student: "",
    program: "",
    cohort: "",
    academic_year: "",
    status: "active",
  });

  async function load() {
    if (!ready || !token) return;
    const [s, p, c, y, e] = await Promise.all([
      apiGet<Page<Student>>("/students/?page_size=100", token),
      apiGet<Page<Program>>("/programs/?page_size=100", token),
      apiGet<Page<Cohort>>("/cohorts/?page_size=100", token),
      apiGet<Page<Year>>("/academic-years/?page_size=50", token),
      apiGet<Page<Enrollment>>("/enrollments/?page_size=50", token),
    ]);
    setStudents(unwrapList(s));
    setPrograms(unwrapList(p));
    setCohorts(unwrapList(c));
    const ys = unwrapList(y);
    setYears(ys);
    setEnrollments(unwrapList(e));
    const current = ys.find((x) => x.is_current) || ys[0];
    if (current && !form.academic_year) {
      setForm((f) => ({ ...f, academic_year: current.id }));
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  const cohortsForProgram = cohorts.filter((c) => !form.program || c.program === form.program);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !token) return;
    setError(null);
    try {
      await apiSend("/enrollments/", token, "POST", form);
      setOk("Inscription enregistrée.");
      clearApiMemoryCache();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  const studentLabel = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.student_number} — ${s.full_name}` : id.slice(0, 8);
  };
  const programLabel = (id: string) => programs.find((x) => x.id === id)?.name || id.slice(0, 8);

  return (
    <PortalShell title="Administration" nav={adminNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Scolarité</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Inscriptions</h1>
      <p className="mt-2 text-sm text-iua-muted">Inscrivez un étudiant à une formation / promotion.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Nouvelle inscription</h2>
          <select
            required
            value={form.student}
            onChange={(e) => setForm({ ...form, student: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="">Étudiant…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.student_number} — {s.full_name}
              </option>
            ))}
          </select>
          <select
            required
            value={form.program}
            onChange={(e) => setForm({ ...form, program: e.target.value, cohort: "" })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="">Formation…</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <select
            required
            value={form.cohort}
            onChange={(e) => setForm({ ...form, cohort: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="">Promotion…</option>
            {cohortsForProgram.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            required
            value={form.academic_year}
            onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="">Année…</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-iua-navy px-4 py-2.5 text-sm text-white">
            Valider l&apos;inscription
          </button>
        </form>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Dernières inscriptions</h2>
          <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
            {enrollments.length === 0 && (
              <li className="py-3 text-iua-muted">Aucune inscription pour le moment.</li>
            )}
            {enrollments.map((en) => (
              <li key={en.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-iua-navy">{studentLabel(en.student)}</p>
                  <p className="text-xs text-iua-muted">{programLabel(en.program)}</p>
                </div>
                <span className="rounded-full bg-iua-mist px-2 py-1 text-[11px] uppercase tracking-wide text-iua-navy">
                  {en.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
