"use client";

import { useTranslations } from "next-intl";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Contact = {
  subject: string;
  subject_id: string;
  teacher: string;
  teacher_id: string;
  email: string;
};

export default function EvaluerPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState({
    subject: "",
    teacher: "",
    clarity: 4,
    usefulness: 4,
    pacing: 4,
    overall: 4,
    comment: "",
    is_anonymous: true,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Contact[]>("/student/contacts/", token).then((d) => {
      setContacts(d);
      if (d[0]) {
        setForm((f) => ({
          ...f,
          subject: d[0].subject_id,
          teacher: d[0].teacher_id,
        }));
      }
    });
  }, [ready, token]);

  function onSubjectChange(subjectId: string) {
    const c = contacts.find((x) => x.subject_id === subjectId);
    setForm((f) => ({
      ...f,
      subject: subjectId,
      teacher: c?.teacher_id || "",
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !form.teacher) {
      setError("Sélectionnez un cours.");
      return;
    }
    setError(null);
    try {
      await apiSend("/teaching-evaluations/", token, "POST", {
        subject: form.subject,
        teacher: form.teacher,
        clarity: form.clarity,
        usefulness: form.usefulness,
        pacing: form.pacing,
        overall: form.overall,
        comment: form.comment,
        is_anonymous: form.is_anonymous,
      });
      setMsg("Évaluation envoyée. Merci pour votre retour.");
      setForm((f) => ({ ...f, comment: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.evaluer")}</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Donnez votre avis (anonyme possible) pour améliorer la pédagogie.
      </p>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-4 rounded-xl bg-white p-5 shadow-soft">
        <select
          required
          value={form.subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        >
          {contacts.length === 0 && <option value="">Aucun cours assigné</option>}
          {contacts.map((c) => (
            <option key={`${c.subject_id}-${c.teacher_id}`} value={c.subject_id}>
              {c.subject} — {c.teacher}
            </option>
          ))}
        </select>
        {(
          [
            ["clarity", "Clarté"],
            ["usefulness", "Utilité"],
            ["pacing", "Rythme"],
            ["overall", "Global"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 flex justify-between text-iua-muted">
              <span>{label}</span>
              <span>{form[key]}/5</span>
            </span>
            <input
              type="range"
              min={1}
              max={5}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
              className="w-full"
            />
          </label>
        ))}
        <textarea
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          rows={3}
          placeholder="Commentaire (optionnel)"
          className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_anonymous}
            onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
          />
          Envoyer anonymement
        </label>
        <button
          type="submit"
          disabled={!form.teacher}
          className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Envoyer l&apos;évaluation
        </button>
      </form>
    </PortalShell>
  );
}
