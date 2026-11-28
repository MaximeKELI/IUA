"use client";

import { useTranslations } from "next-intl";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import {
  apiGet,
  apiSend,
  clearApiMemoryCache,
  ManagedUser,
  Page,
  Role,
  unwrapList,
} from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { canSeeStudentIds, resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type FormState = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  roles: string[];
  is_active: boolean;
  student_number: string;
  program_id: string;
  level: string;
};

const emptyForm: FormState = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
  roles: ["student"],
  is_active: true,
  student_number: "",
  program_id: "",
  level: "L1",
};

type Program = { id: string; name: string; code: string };

export default function AdminUsersPage() {
  const tPortal = useTranslations("portal");

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const myRoles = getStoredUser()?.roles || [];
  const showStudentIds = canSeeStudentIds(myRoles);

  const { token, ready } = useAuthToken();

  async function load() {
    if (!ready || !token) return;
    const [usersPage, rolesData, programsPage] = await Promise.all([
      apiGet<Page<ManagedUser>>("/users/?page_size=100", token),
      apiGet<Role[] | Page<Role>>("/roles/", token),
      apiGet<Page<Program>>("/programs/?page_size=100", token),
    ]);
    setUsers(unwrapList(usersPage));
    setRoles(unwrapList(rolesData as Page<Role> | Role[]));
    setPrograms(unwrapList(programsPage));
  }

  useEffect(() => {
    if (!ready || !token) return;
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement"));
  }, [ready, token]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(needle) ||
        u.full_name.toLowerCase().includes(needle) ||
        u.roles.join(" ").toLowerCase().includes(needle),
    );
  }, [users, q]);

  function toggleRole(code: string) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(code) ? f.roles.filter((r) => r !== code) : [...f.roles, code],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !token) return;
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        roles: form.roles,
        is_active: form.is_active,
        student_number: form.student_number || undefined,
        program_id: form.program_id || null,
        level: form.level || "",
      };
      if (editingId) {
        const body = { ...payload };
        if (!body.password) delete (body as { password?: string }).password;
        await apiSend(`/users/${editingId}/`, token, "PATCH", body);
        setOk("Utilisateur mis à jour.");
      } else {
        if (!form.password) throw new Error("Mot de passe requis pour créer un compte.");
        await apiSend("/users/", token, "POST", payload);
        setOk("Utilisateur créé et autorisé.");
      }
      clearApiMemoryCache();
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setLoading(false);
    }
  }

  function editUser(u: ManagedUser) {
    setEditingId(u.id);
    setForm({
      email: u.email,
      password: "",
      first_name: u.first_name,
      last_name: u.last_name,
      phone: u.phone || "",
      roles: u.roles.length ? u.roles : ["student"],
      is_active: u.is_active,
      student_number: "",
      program_id: "",
      level: "L1",
    });
    setOk(null);
    setError(null);
  }

  async function toggleActive(u: ManagedUser) {
    if (!ready || !token) return;
    try {
      await apiSend(`/users/${u.id}/${u.is_active ? "deactivate" : "activate"}/`, token, "POST");
      clearApiMemoryCache();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    }
  }

  return (
    <PortalShell title={resolveOpsTitle(myRoles)} nav={resolveOpsNav(myRoles)}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Autorisations</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">{tPortal("pages.admin.utilisateurs")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">
        Créez un compte et attribuez les rôles. C&apos;est ici que l&apos;accès est accordé.
        {!showStudentIds && " Les matricules restent masqués pour votre profil."}
      </p>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl text-iua-navy">Annuaire</h2>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher…"
              className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-4 max-h-[28rem] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-iua-muted">
                <tr>
                  <th className="py-2 pr-2">Nom</th>
                  <th className="py-2 pr-2">Rôles</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iua-navy/10">
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-2">
                      <p className="font-medium text-iua-navy">{u.full_name}</p>
                      <p className="text-xs text-iua-muted">{u.email}</p>
                      {!u.is_active && (
                        <p className="text-[11px] uppercase tracking-wide text-red-600">Inactif</p>
                      )}
                    </td>
                    <td className="py-3 pr-2 text-xs text-iua-muted">
                      {u.roles
                        .map((code) => roles.find((r) => r.code === code)?.name || code)
                        .join(", ") || "—"}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => editUser(u)}
                          className="rounded border border-iua-navy/15 px-2 py-1 text-xs"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(u)}
                          className="rounded border border-iua-navy/15 px-2 py-1 text-xs"
                        >
                          {u.is_active ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">
            {editingId ? "Modifier l'accès" : "Créer un accès"}
          </h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Prénom">
                <input
                  required
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Nom">
                <input
                  required
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <Field label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
              />
            </Field>
            <Field label={editingId ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                minLength={10}
                required={!editingId}
              />
            </Field>
            <Field label="Téléphone">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
              />
            </Field>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-iua-muted">
                Rôles autorisés
              </p>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const on = form.roles.includes(r.code);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRole(r.code)}
                      className={`rounded-full px-3 py-1.5 text-xs ${
                        on ? "bg-iua-navy text-white" : "bg-iua-mist text-iua-navy"
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {form.roles.includes("student") && (
              <div className="space-y-3 rounded-lg border border-iua-navy/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-iua-muted">
                  Profil étudiant
                </p>
                {showStudentIds ? (
                  <Field label="Matricule (auto si vide)">
                    <input
                      value={form.student_number}
                      onChange={(e) => setForm({ ...form, student_number: e.target.value })}
                      className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                    />
                  </Field>
                ) : (
                  <p className="text-xs text-iua-muted">
                    Matricule généré automatiquement (non visible pour la direction).
                  </p>
                )}
                <Field label="Formation (obligatoire)">
                  <select
                    required
                    value={form.program_id}
                    onChange={(e) => setForm({ ...form, program_id: e.target.value })}
                    className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                  >
                    <option value="">Choisir une formation…</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Niveau">
                  <input
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
                  />
                </Field>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-iua-navy">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Compte actif
            </label>

            {error && <p className="text-sm text-red-700">{error}</p>}
            {ok && <p className="text-sm text-emerald-700">{ok}</p>}

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Enregistrement…" : editingId ? "Enregistrer" : "Créer et autoriser"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="rounded-md border border-iua-navy/15 px-4 py-2.5 text-sm"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </PortalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-iua-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
