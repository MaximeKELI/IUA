"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type I = { id: string; company: string; role: string; city: string; status: string; notes: string };
export default function Page() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<I[]>([]);
  const [form, setForm] = useState({ company: "", role: "", city: "Abidjan", status: "searching", notes: "" });
  const [msg, setMsg] = useState<string | null>(null);
  async function reload(){ if(!token) return; setItems(unwrapList(await apiGet<Page<I>>("/student/internships/", token))); }
  useEffect(()=>{ if(ready&&token) void reload(); },[ready,token]);
  async function onSubmit(e: FormEvent){ e.preventDefault(); if(!token) return; await apiSend("/student/internships/", token, "POST", form); clearApiMemoryCache(); setMsg("Stage enregistré."); setForm({company:"",role:"",city:"Abidjan",status:"searching",notes:""}); await reload(); }
  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.stages")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Suivez vos recherches et stages en entreprise.</p>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      <form onSubmit={onSubmit} className="mt-8 grid gap-3 rounded-xl bg-white p-5 shadow-soft md:grid-cols-2">
        <input required placeholder="Entreprise" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm" />
        <input placeholder="Poste" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm" />
        <input placeholder="Ville" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm" />
        <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm">
          <option value="searching">En recherche</option><option value="ongoing">En cours</option><option value="done">Terminé</option>
        </select>
        <textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="rounded-md border border-iua-navy/15 px-3 py-2 text-sm md:col-span-2" rows={3} />
        <button type="submit" className="rounded-md bg-iua-navy px-4 py-2 text-sm font-semibold text-white md:col-span-2">Ajouter</button>
      </form>
      <ul className="mt-8 space-y-3">{items.map(i=>(
        <li key={i.id} className="rounded-xl bg-white p-5 shadow-soft"><p className="font-display text-xl text-iua-navy">{i.company}</p><p className="text-sm text-iua-muted">{i.role} · {i.city} · {i.status}</p></li>
      ))}</ul>
    </PortalShell>
  );
}
