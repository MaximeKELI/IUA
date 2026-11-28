"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type Hw = { id: string; title: string; instructions: string; due_at: string; subject_name?: string; allow_late: boolean };
export default function Page() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Hw[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!ready||!token) return; apiGet<Page<Hw>>("/student/homeworks/?page_size=50", token).then(d=>setItems(unwrapList(d))).catch(e=>setError(e instanceof Error?e.message:"Erreur")); }, [ready,token]);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!token || !open) return;
    try { await apiSend(`/student/homeworks/${open}/submit/`, token, "POST", { content }); setMsg("Devoir remis."); setContent(""); setOpen(null);} catch(err){ setError(err instanceof Error?err.message:"Échec"); }
  }
  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.devoirs")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Deadlines, consignes et remise en ligne.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      <ul className="mt-8 space-y-3">{items.map(item => {
        const overdue = new Date(item.due_at).getTime() < Date.now();
        return (
          <li key={item.id} className="rounded-xl bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-iua-navy">{item.title}</h2>
                <p className="text-xs text-iua-muted">{item.subject_name}</p>
                <p className="mt-2 text-sm text-iua-muted">{item.instructions}</p>
              </div>
              <div className="text-right">
                <p className={overdue ? "font-semibold text-red-600" : "text-iua-navy"}>{new Date(item.due_at).toLocaleString("fr-FR")}</p>
                <button type="button" onClick={() => setOpen(item.id)} className="mt-2 rounded-md bg-iua-navy px-3 py-1.5 text-xs font-semibold text-white">Remettre</button>
              </div>
            </div>
          </li>
        );
      })}</ul>
      {open && (
        <form onSubmit={submit} className="mt-6 rounded-xl bg-white p-5 shadow-soft space-y-3">
          <h2 className="font-display text-lg text-iua-navy">Remise</h2>
          <textarea required rows={5} value={content} onChange={(e)=>setContent(e.target.value)} className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm" placeholder="Votre réponse / lien de fichier…" />
          <button type="submit" className="rounded-md bg-iua-sun px-4 py-2 text-sm font-semibold text-iua-navy">Envoyer</button>
        </form>
      )}
    </PortalShell>
  );
}
