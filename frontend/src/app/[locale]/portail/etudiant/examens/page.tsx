"use client";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type E = { id: string; title: string; subject_name: string; starts_at: string; room: string; notes: string };
export default function Page() {
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<E[]>([]);
  useEffect(()=>{ if(!ready||!token) return; apiGet<Page<E>>("/student/exams/", token).then(d=>setItems(unwrapList(d))); },[ready,token]);
  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">Calendrier des examens</h1>
      <p className="mt-2 text-sm text-iua-muted">Dates, salles et consignes de session.</p>
      <ul className="mt-8 space-y-3">{items.map(e=>(
        <li key={e.id} className="rounded-xl bg-white p-5 shadow-soft flex justify-between gap-3">
          <div><h2 className="font-display text-xl text-iua-navy">{e.title}</h2><p className="text-sm text-iua-muted">{e.subject_name}</p><p className="mt-1 text-xs text-iua-muted">{e.notes}</p></div>
          <div className="text-right text-sm"><p className="font-semibold text-iua-navy">{new Date(e.starts_at).toLocaleString("fr-FR")}</p><p className="text-iua-muted">{e.room||"Salle —"}</p></div>
        </li>
      ))}{items.length===0 && <li className="text-sm text-iua-muted">Aucun examen planifié.</li>}</ul>
    </PortalShell>
  );
}
