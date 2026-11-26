"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";
import { adminNav } from "@/lib/navigation";

type Faculty = { id: string; name: string; code: string; institution: string; is_active: boolean };
type Program = {
  id: string;
  name: string;
  code: string;
  faculty: string;
  degree_level: string;
  is_active: boolean;
};
type Institution = { id: string; name: string; code: string };

export default function AdminFormationsPage() {
  const { token, ready } = useAuthToken();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [facultyForm, setFacultyForm] = useState({ code: "", name: "", institution: "" });
  const [programForm, setProgramForm] = useState({
    code: "",
    name: "",
    faculty: "",
    degree_level: "license",
  });

  async function load() {
    if (!ready || !token) return;
    const [f, p, i] = await Promise.all([
      apiGet<Page<Faculty>>("/faculties/?page_size=100", token),
      apiGet<Page<Program>>("/programs/?page_size=100", token),
      apiGet<Page<Institution>>("/institutions/?page_size=50", token),
    ]);
    const inst = unwrapList(i);
    setInstitutions(inst);
    setFaculties(unwrapList(f));
    setPrograms(unwrapList(p));
    if (!facultyForm.institution && inst[0]) {
      setFacultyForm((x) => ({ ...x, institution: inst[0].id }));
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  async function createFaculty(e: FormEvent) {
    e.preventDefault();
    if (!ready || !token) return;
    setError(null);
    try {
      await apiSend("/faculties/", token, "POST", {
        ...facultyForm,
        is_active: true,
      });
      setOk("Faculté créée.");
      setFacultyForm((f) => ({ ...f, code: "", name: "" }));
      clearApiMemoryCache();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  async function createProgram(e: FormEvent) {
    e.preventDefault();
    if (!ready || !token) return;
    setError(null);
    try {
      await apiSend("/programs/", token, "POST", {
        ...programForm,
        is_active: true,
        description: "",
      });
      setOk("Formation créée.");
      setProgramForm((p) => ({ ...p, code: "", name: "" }));
      clearApiMemoryCache();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Administration" nav={adminNav}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Référentiels</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">Formations</h1>
      <p className="mt-2 text-sm text-iua-muted">Gérez facultés et programmes — données réelles API.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Facultés</h2>
          <ul className="mt-4 max-h-48 divide-y divide-iua-navy/10 overflow-auto text-sm">
            {faculties.map((f) => (
              <li key={f.id} className="flex justify-between py-2">
                <span className="font-medium text-iua-navy">{f.name}</span>
                <span className="text-iua-muted">{f.code}</span>
              </li>
            ))}
          </ul>
          <form onSubmit={createFaculty} className="mt-4 space-y-3 border-t border-iua-navy/10 pt-4">
            <input
              required
              placeholder="Code"
              value={facultyForm.code}
              onChange={(e) => setFacultyForm({ ...facultyForm, code: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Nom"
              value={facultyForm.name}
              onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            />
            <select
              required
              value={facultyForm.institution}
              onChange={(e) => setFacultyForm({ ...facultyForm, institution: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            >
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md bg-iua-navy px-4 py-2 text-sm text-white">
              Ajouter la faculté
            </button>
          </form>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Programmes</h2>
          <ul className="mt-4 max-h-48 divide-y divide-iua-navy/10 overflow-auto text-sm">
            {programs.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span className="font-medium text-iua-navy">{p.name}</span>
                <span className="text-iua-muted">
                  {p.code} · {p.degree_level}
                </span>
              </li>
            ))}
          </ul>
          <form onSubmit={createProgram} className="mt-4 space-y-3 border-t border-iua-navy/10 pt-4">
            <input
              required
              placeholder="Code"
              value={programForm.code}
              onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Nom"
              value={programForm.name}
              onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            />
            <select
              required
              value={programForm.faculty}
              onChange={(e) => setProgramForm({ ...programForm, faculty: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            >
              <option value="">Faculté…</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <select
              value={programForm.degree_level}
              onChange={(e) => setProgramForm({ ...programForm, degree_level: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            >
              <option value="license">Licence</option>
              <option value="master">Master</option>
              <option value="doctorate">Doctorat</option>
            </select>
            <button type="submit" className="rounded-md bg-iua-navy px-4 py-2 text-sm text-white">
              Ajouter la formation
            </button>
          </form>
        </section>
      </div>
    </PortalShell>
  );
}
