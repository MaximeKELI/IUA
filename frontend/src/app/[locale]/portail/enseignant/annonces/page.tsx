"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useTeacherAssignments } from "@/lib/teacher";

type Announcement = {
  id: string;
  title: string;
  body: string;
  subject_name?: string;
  is_pinned: boolean;
  created_at: string;
};

export default function AnnoncesPage() {
  const { token, ready, assignments } = useTeacherAssignments();
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState({
    subject: "",
    title: "",
    body: "",
    is_pinned: false,
    notify_students: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    setItems(unwrapList(await apiGet<Page<Announcement>>("/announcements/?page_size=50", token)));
  }

  useEffect(() => {
    if (ready && token) void reload().catch((e) => setError(String(e.message || e)));
    if (!form.subject && assignments[0]) setForm((f) => ({ ...f, subject: assignments[0].subject }));
  }, [ready, token, assignments]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await apiSend("/announcements/", token, "POST", form);
      clearApiMemoryCache();
      setOk("Annonce publiée" + (form.notify_students ? " et notifiée aux étudiants." : "."));
      setForm((f) => ({ ...f, title: "", body: "" }));
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Annonces de classe</h1>
      <p className="mt-2 text-sm text-iua-muted">Messagerie pédagogique : annonces épinglées et notifications in-app.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <form onSubmit={onSubmit} className="mt-8 space-y-3 rounded-xl bg-white p-5 shadow-soft">
        <select
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        >
          {assignments.map((a) => (
            <option key={a.id} value={a.subject}>
              {a.subject_name}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Titre"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <textarea
          required
          placeholder="Message"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={4}
          className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_pinned}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
            />
            Épingler
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.notify_students}
              onChange={(e) => setForm({ ...form, notify_students: e.target.checked })}
            />
            Notifier les étudiants
          </label>
        </div>
        <button type="submit" className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white">
          Publier
        </button>
      </form>

      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              {item.is_pinned && (
                <span className="rounded bg-iua-sun/30 px-2 py-0.5 text-[10px] font-semibold uppercase text-iua-navy">
                  Épinglée
                </span>
              )}
              <p className="text-xs text-iua-muted">{item.subject_name}</p>
            </div>
            <h2 className="mt-2 font-display text-xl text-iua-navy">{item.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-iua-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
