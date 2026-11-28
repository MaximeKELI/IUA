"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { canEditTeaching, resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type Assignment = {
  id: string;
  teacher: string;
  subject: string;
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string;
  academic_year: string;
};

type Subject = { id: string; name: string; code: string };
type Year = { id: string; name: string; is_current: boolean };
type TeacherOption = { id: string; label: string; staff_id: string };

export default function AdminEnseignementsPage() {
  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];
  const canEdit = canEditTeaching(roles);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState({ teacher: "", subject: "", academic_year: "" });

  async function load() {
    if (!ready || !token) return;
    const [a, s, y, users] = await Promise.all([
      apiGet<Page<Assignment>>("/teaching-assignments/?page_size=100", token),
      apiGet<Page<Subject>>("/subjects/?page_size=100", token),
      apiGet<Page<Year>>("/academic-years/?page_size=50", token),
      apiGet<Page<{ id: string; full_name: string; email: string; roles: string[] }>>(
        "/users/?page_size=100",
        token,
      ),
    ]);
    setAssignments(unwrapList(a));
    setSubjects(unwrapList(s));
    const ys = unwrapList(y);
    setYears(ys);

    const teacherUsers = unwrapList(users).filter((u) => u.roles.includes("teacher"));
    const staffPage = await apiGet<
      Page<{ id: string; user: string; staff_number: string; user_email?: string }>
    >("/staff/?page_size=100", token);
    const staff = unwrapList(staffPage);
    setTeachers(
      teacherUsers.map((u) => {
        const sp = staff.find((x) => x.user === u.id || x.user_email === u.email);
        return {
          id: u.id,
          label: `${u.full_name} (${u.email})`,
          staff_id: sp?.id || "",
        };
      }),
    );

    if (!form.academic_year) {
      const current = ys.find((x) => x.is_current) || ys[0];
      if (current) setForm((f) => ({ ...f, academic_year: current.id }));
    }
  }

  useEffect(() => {
    if (!ready || !token) return;
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    const teacher = teachers.find((t) => t.id === form.teacher);
    if (!teacher?.staff_id) {
      setError("Profil enseignant introuvable (staff). Recréez le compte avec le rôle Enseignant.");
      return;
    }
    try {
      await apiSend("/teaching-assignments/", token, "POST", {
        teacher: teacher.staff_id,
        subject: form.subject,
        academic_year: form.academic_year,
      });
      setOk("Affectation enregistrée.");
      clearApiMemoryCache();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Pédagogie</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Affectations enseignants</h1>
      <p className="mt-2 text-sm text-iua-muted">
        {canEdit
          ? "Associez un enseignant à une matière pour ouvrir la saisie des notes."
          : "Consultation uniquement. Les affectations se gèrent au secrétariat."}
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <div className={`mt-8 grid gap-6 ${canEdit ? "lg:grid-cols-2" : ""}`}>
        {canEdit && (
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Nouvelle affectation</h2>
          <select
            required
            value={form.teacher}
            onChange={(e) => setForm({ ...form, teacher: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="">Enseignant…</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id} disabled={!t.staff_id}>
                {t.label}
                {!t.staff_id ? " (profil manquant)" : ""}
              </option>
            ))}
          </select>
          <select
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="">Matière…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
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
            Affecter
          </button>
        </form>
        )}

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Affectations actuelles</h2>
          <ul className="mt-4 divide-y divide-iua-navy/10 text-sm">
            {assignments.length === 0 && (
              <li className="py-3 text-iua-muted">Aucune affectation.</li>
            )}
            {assignments.map((a) => (
              <li key={a.id} className="py-3">
                <p className="font-medium text-iua-navy">
                  {a.subject_name || a.subject.slice(0, 8)}
                </p>
                <p className="text-xs text-iua-muted">
                  {a.teacher_name || "Enseignant"} · {a.subject_code}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
