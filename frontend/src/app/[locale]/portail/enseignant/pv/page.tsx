"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useTeacherAssignments } from "@/lib/teacher";

type Signature = {
  id: string;
  subject_name?: string;
  title: string;
  signature_name: string;
  signed_at: string;
  payload_hash: string;
  snapshot: { grades_count?: number; avg_score?: number | null };
  notes: string;
};

export default function PvPage() {
  const { token, ready, assignments } = useTeacherAssignments();
  const [items, setItems] = useState<Signature[]>([]);
  const [form, setForm] = useState({
    subject: "",
    title: "PV de notes",
    signature_name: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    setItems(unwrapList(await apiGet<Page<Signature>>("/grade-signatures/?page_size=50", token)));
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
      await apiSend("/grade-signatures/", token, "POST", {
        ...form,
        academic_year: a.academic_year,
      });
      clearApiMemoryCache();
      setOk("PV signé numériquement (empreinte SHA-256 du carnet).");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">PV de notes & signature</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Gèle un instantané du carnet et attache une signature nominative avec hash d&apos;intégrité.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

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
          placeholder="Nom du signataire"
          value={form.signature_name}
          onChange={(e) => setForm({ ...form, signature_name: e.target.value })}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm md:col-span-2"
        />
        <textarea
          placeholder="Observations du PV"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm md:col-span-2"
        />
        <button type="submit" className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white md:col-span-2">
          Signer le PV
        </button>
      </form>

      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-white p-5 shadow-soft">
            <h2 className="font-display text-xl text-iua-navy">{item.title}</h2>
            <p className="text-xs text-iua-muted">
              {item.subject_name} · signé par {item.signature_name} ·{" "}
              {new Date(item.signed_at).toLocaleString("fr-FR")}
            </p>
            <p className="mt-2 text-sm text-iua-muted">
              {item.snapshot?.grades_count ?? 0} notes · moy. {item.snapshot?.avg_score ?? "—"}
            </p>
            <p className="mt-2 break-all font-mono text-[10px] text-iua-muted">{item.payload_hash}</p>
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
