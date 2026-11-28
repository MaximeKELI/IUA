"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type C = { subject: string; subject_id: string; teacher: string; email: string };
export default function Page() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [contacts, setContacts] = useState<C[]>([]);
  const [form, setForm] = useState({ subject: "", body: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(()=>{ if(!ready||!token) return; apiGet<C[]>("/student/contacts/", token).then(d=>{ setContacts(d); if(d[0]) setForm(f=>({...f, subject:d[0].subject_id})); }); },[ready,token]);
  async function onSubmit(e: FormEvent){ e.preventDefault(); if(!token) return; try{ await apiSend("/student/contacts/", token, "POST", form); setMsg("Message envoyé à l'enseignant (notification)."); setForm(f=>({...f, body:""})); } catch(err){ setError(err instanceof Error?err.message:"Échec"); } }
  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.messages")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Écrivez à l&apos;enseignant d&apos;une de vos matières.</p>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <form onSubmit={onSubmit} className="mt-8 space-y-3 rounded-xl bg-white p-5 shadow-soft max-w-2xl">
        <select required value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})} className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm">
          {contacts.map(c=><option key={c.subject_id} value={c.subject_id}>{c.subject} — {c.teacher}</option>)}
        </select>
        <textarea required rows={5} value={form.body} onChange={e=>setForm({...form, body:e.target.value})} placeholder="Votre message…" className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white">Envoyer</button>
      </form>
      <ul className="mt-8 space-y-2 text-sm">{contacts.map(c=>(
        <li key={c.subject_id} className="rounded-xl bg-white px-4 py-3 shadow-soft flex justify-between"><span>{c.teacher} · {c.subject}</span><a className="text-iua-cyan" href={`mailto:${c.email}`}>{c.email}</a></li>
      ))}</ul>
    </PortalShell>
  );
}
