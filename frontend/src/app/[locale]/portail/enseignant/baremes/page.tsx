"use client";

import { useTranslations } from "next-intl";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useTeacherAssignments } from "@/lib/teacher";

type Scheme = {
  id?: string;
  subject: string;
  interro_weight: string;
  devoir_weight: string;
  tp_weight: string;
  exam_weight: string;
  max_score_default: string;
  interro_count: number;
  devoir_count: number;
  notes: string;
};

const empty = (subject: string): Scheme => ({
  subject,
  interro_weight: "1",
  devoir_weight: "1.5",
  tp_weight: "1",
  exam_weight: "2",
  max_score_default: "20",
  interro_count: 2,
  devoir_count: 2,
  notes: "",
});

export default function BaremesPage() {
  const tPortal = useTranslations("portal");

  const { token, ready, assignments, error: bootError } = useTeacherAssignments();
  const [subjectId, setSubjectId] = useState("");
  const [form, setForm] = useState<Scheme>(empty(""));
  const [schemeId, setSchemeId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId && assignments[0]) setSubjectId(assignments[0].subject);
  }, [assignments, subjectId]);

  useEffect(() => {
    if (!ready || !token || !subjectId) return;
    apiGet<Page<Scheme & { id: string }>>(`/grade-schemes/?subject=${subjectId}`, token)
      .then((data) => {
        const existing = unwrapList(data)[0];
        if (existing) {
          setSchemeId(existing.id);
          setForm({
            subject: existing.subject,
            interro_weight: String(existing.interro_weight),
            devoir_weight: String(existing.devoir_weight),
            tp_weight: String(existing.tp_weight),
            exam_weight: String(existing.exam_weight),
            max_score_default: String(existing.max_score_default),
            interro_count: Number(existing.interro_count || 1),
            devoir_count: Number(existing.devoir_count || 1),
            notes: existing.notes || "",
          });
        } else {
          setSchemeId(null);
          setForm(empty(subjectId));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [ready, token, subjectId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !subjectId) return;
    setError(null);
    setMsg(null);
    const payload = { ...form, subject: subjectId };
    try {
      if (schemeId) await apiSend(`/grade-schemes/${schemeId}/`, token, "PATCH", payload);
      else {
        const created = await apiSend<Scheme & { id: string }>("/grade-schemes/", token, "POST", payload);
        setSchemeId(created.id);
      }
      clearApiMemoryCache();
      setMsg("Barème enregistré — le carnet utilisera ces colonnes et coefficients.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title={tPortal("teacher.space")} nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.teacher.baremes")}</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Configurez le nombre d&apos;interros/devoirs et les poids. Le carnet se met à jour automatiquement.
      </p>
      {(error || bootError) && <p className="mt-4 text-sm text-red-700">{error || bootError}</p>}
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      <form onSubmit={onSubmit} className="mt-8 max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-soft">
        <label className="block text-sm">
          <span className="mb-1 block text-iua-muted">Matière</span>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full rounded-md border border-iua-navy/15 px-3 py-2">
            {assignments.map((a) => <option key={a.id} value={a.subject}>{a.subject_name}</option>)}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["interro_count", "Nb interros"],
            ["devoir_count", "Nb devoirs"],
            ["interro_weight", "Coeff interro"],
            ["devoir_weight", "Coeff devoir"],
            ["tp_weight", "Coeff TP"],
            ["exam_weight", "Coeff examen"],
            ["max_score_default", "Note sur"],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block text-iua-muted">{label}</span>
              <input
                type="number"
                step="0.25"
                min="0"
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: key.includes("count") ? Number(e.target.value) : e.target.value })}
                className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
              />
            </label>
          ))}
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-iua-muted">Notes / consignes</span>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-md border border-iua-navy/15 px-3 py-2" />
        </label>
        <button type="submit" className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white">Enregistrer le barème</button>
      </form>
    </PortalShell>
  );
}
