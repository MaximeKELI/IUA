"use client";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type Opp = { id: string; title: string; company: string; kind: string; location: string; description: string; url: string; deadline: string | null };
export default function Page() {
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Opp[]>([]);
  useEffect(()=>{ if(!ready||!token) return; apiGet<Page<Opp>>("/student/careers/", token).then(d=>setItems(unwrapList(d))); },[ready,token]);
  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">Orientation carrière</h1>
      <p className="mt-2 text-sm text-iua-muted">Offres d&apos;emploi, stages et événements pro.</p>
      <div className="mt-8 space-y-3">{items.map(o=>(
        <article key={o.id} className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase text-iua-cyan">{o.kind}</p>
          <h2 className="font-display text-xl text-iua-navy">{o.title}</h2>
          <p className="text-sm text-iua-muted">{o.company} · {o.location}</p>
          <p className="mt-2 text-sm text-iua-muted">{o.description}</p>
          {o.url && <a href={o.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-iua-cyan">Voir →</a>}
        </article>
      ))}</div>
    </PortalShell>
  );
}
