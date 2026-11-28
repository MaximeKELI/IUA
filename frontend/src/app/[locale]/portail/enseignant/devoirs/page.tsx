"use client";

import { useTranslations } from "next-intl";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useTeacherAssignments } from "@/lib/teacher";

type Homework = {
  id: string;
  subject: string;
  subject_name?: string;
  title: string;
  instructions: string;
  due_at: string;
  max_score: string;
  allow_late: boolean;
  submissions_count?: number;
};

export default function DevoirsPage() {
  const tPortal = useTranslations("portal");

  const { token, ready, assignments } = useTeacherAssignments();
  const [items, setItems] = useState<Homework[]>([]);
  const [form, setForm] = useState({
    subject: "",
    title: "",
    instructions: "",
    due_at: "",
    max_score: "20",
    allow_late: false,
    is_published: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    setItems(unwrapList(await apiGet<Page<Homework>>("/homeworks/?page_size=100", token)));
  }

  useEffect(() => {
    if (ready && token) void reload().catch((e) => setError(String(e.message || e)));
    if (!form.subject && assignments[0]) setForm((f) => ({ ...f, subject: assignments[0].subject }));
  }, [ready, token, assignments]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const a = assignments.find((x) => x.subject === form.subject);
    if (!a) return;
    try {
      await apiSend("/homeworks/", token, "POST", { ...form, academic_year: a.academic_year });
      clearApiMemoryCache();
      setOk("Devoir publié avec deadline.");
      setForm((f) => ({ ...f, title: "", instructions: "" }));
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title={tPortal("teacher.space")} nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.teacher.devoirs")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Publiez un devoir avec date limite, consignes et suivi des remises.</p>
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
          <span className="mb-1 block text-iua-muted">Deadline</span>
          <input
            required
            type="datetime-local"
            value={form.due_at}
            onChange={(e) => setForm({ ...form, due_at: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          />
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
          <span className="mb-1 block text-iua-muted">Consignes</span>
          <textarea
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-iua-navy md:col-span-2">
          <input
            type="checkbox"
            checked={form.allow_late}
            onChange={(e) => setForm({ ...form, allow_late: e.target.checked })}
          />
          Autoriser les remises en retard
        </label>
        <button type="submit" className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white md:col-span-2">
          Publier le devoir
        </button>
      </form>

      <ul className="mt-8 space-y-3">
        {items.map((item) => {
          const overdue = new Date(item.due_at).getTime() < Date.now();
          return (
            <li key={item.id} className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl text-iua-navy">{item.title}</h2>
                  <p className="text-xs text-iua-muted">{item.subject_name}</p>
                  <p className="mt-2 text-sm text-iua-muted">{item.instructions}</p>
                </div>
                <div className="text-right text-sm">
                  <p className={overdue ? "font-semibold text-red-600" : "text-iua-navy"}>
                    Échéance {new Date(item.due_at).toLocaleString("fr-FR")}
                  </p>
                  <p className="text-iua-muted">{item.submissions_count ?? 0} remise(s)</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </PortalShell>
  );
}
