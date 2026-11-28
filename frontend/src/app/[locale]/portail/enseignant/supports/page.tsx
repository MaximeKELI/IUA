"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useTeacherAssignments } from "@/lib/teacher";

type Material = {
  id: string;
  subject: string;
  subject_name?: string;
  title: string;
  kind: string;
  description: string;
  url: string;
  file_name: string;
  is_published: boolean;
};

export default function SupportsPage() {
  const { token, ready, assignments } = useTeacherAssignments();
  const [items, setItems] = useState<Material[]>([]);
  const [form, setForm] = useState({
    subject: "",
    title: "",
    kind: "pdf",
    description: "",
    url: "",
    file_name: "",
    is_published: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    setItems(unwrapList(await apiGet<Page<Material>>("/course-materials/?page_size=100", token)));
  }

  useEffect(() => {
    if (ready && token) void reload().catch((e) => setError(String(e.message || e)));
    if (!form.subject && assignments[0]) setForm((f) => ({ ...f, subject: assignments[0].subject }));
  }, [ready, token, assignments]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await apiSend("/course-materials/", token, "POST", form);
      clearApiMemoryCache();
      setOk("Support publié.");
      setForm((f) => ({ ...f, title: "", description: "", url: "", file_name: "" }));
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Supports de cours</h1>
      <p className="mt-2 text-sm text-iua-muted">PDF, slides, vidéos ou liens — visibles par les étudiants de la matière.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <form onSubmit={onSubmit} className="mt-8 grid gap-3 rounded-xl bg-white p-5 shadow-soft md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-iua-muted">Matière</span>
          <select
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.subject}>
                {a.subject_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-iua-muted">Type</span>
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          >
            <option value="pdf">PDF</option>
            <option value="slides">Slides</option>
            <option value="video">Vidéo</option>
            <option value="link">Lien</option>
            <option value="other">Autre</option>
          </select>
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-iua-muted">Titre</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-iua-muted">URL / lien de téléchargement</span>
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://…"
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-iua-muted">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white md:col-span-2">
          Déposer le support
        </button>
      </form>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl bg-white p-5 shadow-soft">
            <p className="text-xs uppercase tracking-[0.14em] text-iua-cyan">{item.kind}</p>
            <h2 className="mt-1 font-display text-xl text-iua-navy">{item.title}</h2>
            <p className="mt-1 text-xs text-iua-muted">{item.subject_name}</p>
            <p className="mt-3 text-sm text-iua-muted">{item.description}</p>
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-iua-cyan">
                Ouvrir →
              </a>
            )}
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
