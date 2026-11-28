"use client";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type S = { id: string; title: string; provider: string; amount_label: string; deadline: string | null; description: string; url: string };
export default function Page() {
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<S[]>([]);
  useEffect(()=>{ if(!ready||!token) return; apiGet<Page<S>>("/student/scholarships/", token).then(d=>setItems(unwrapList(d))); },[ready,token]);
  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">Bourses & aides</h1>
      <p className="mt-2 text-sm text-iua-muted">Offres de bourses ouvertes aux étudiants IUA.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">{items.map(s=>(
        <article key={s.id} className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">{s.title}</h2>
          <p className="text-sm text-iua-muted">{s.provider} · {s.amount_label}</p>
          <p className="mt-2 text-xs text-iua-muted">Deadline : {s.deadline || "—"}</p>
          <p className="mt-3 text-sm text-iua-muted">{s.description}</p>
          {s.url && <a href={s.url} className="mt-4 inline-flex text-sm font-semibold text-iua-cyan" target="_blank" rel="noreferrer">Candidater →</a>}
        </article>
      ))}</div>
    </PortalShell>
  );
}
