"use client";

import { useTranslations } from "next-intl";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useTeacherAssignments } from "@/lib/teacher";

type Meeting = {
  id: string;
  title: string;
  subject_name?: string;
  room_name: string;
  jitsi_url: string;
  scheduled_at: string | null;
  is_active: boolean;
};

export default function VisioPage() {
  const tPortal = useTranslations("portal");

  const { token, ready, assignments } = useTeacherAssignments();
  const [items, setItems] = useState<Meeting[]>([]);
  const [form, setForm] = useState({ subject: "", title: "", room_name: "", scheduled_at: "" });
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    setItems(unwrapList(await apiGet<Page<Meeting>>("/meetings/?page_size=50", token)));
  }

  useEffect(() => {
    if (ready && token) void reload().catch((e) => setError(String(e.message || e)));
    if (!form.subject && assignments[0]) setForm((f) => ({ ...f, subject: assignments[0].subject }));
  }, [ready, token, assignments]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await apiSend("/meetings/", token, "POST", {
        ...form,
        scheduled_at: form.scheduled_at || null,
      });
      clearApiMemoryCache();
      await reload();
      setForm((f) => ({ ...f, title: "", room_name: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title={tPortal("teacher.space")} nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.teacher.visio")}</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Créez une salle de visioconférence liée à votre cours — ouverture directe dans Jitsi Meet.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <form onSubmit={onSubmit} className="mt-8 grid gap-3 rounded-xl bg-white p-5 shadow-soft md:grid-cols-2">
        <select
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        >
          {assignments.map((a) => (
            <option key={a.id} value={a.subject}>
              {a.subject_name}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Titre de la session"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <input
          placeholder="Nom de salle (auto si vide)"
          value={form.room_name}
          onChange={(e) => setForm({ ...form, room_name: e.target.value })}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <input
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white md:col-span-2">
          Créer la salle
        </button>
      </form>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((m) => (
          <article key={m.id} className="rounded-xl bg-iua-navy p-5 text-white shadow-soft">
            <h2 className="font-display text-xl">{m.title}</h2>
            <p className="mt-1 text-sm text-white/70">{m.subject_name}</p>
            <p className="mt-3 font-mono text-xs text-iua-cyan">{m.room_name}</p>
            <a
              href={m.jitsi_url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-md bg-iua-sun px-4 py-2 text-sm font-semibold text-iua-navy"
            >
              Lancer Jitsi
            </a>
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
