"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type Item = { id: string; title: string; author: string; kind: string; subject_tags: string; available: boolean; url: string };
export default function Page() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { if (!ready||!token) return; apiGet<Page<Item>>("/student/library/?page_size=100", token).then(d=>setItems(unwrapList(d))); }, [ready,token]);
  const filtered = items.filter(i => !q || `${i.title} ${i.author} ${i.subject_tags}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.bibliotheque")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Catalogue de ressources pédagogiques.</p>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher…" className="mt-6 w-full max-w-md rounded-md border border-iua-navy/15 px-3 py-2 text-sm" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map(i=>(
        <article key={i.id} className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase text-iua-cyan">{i.kind} · {i.available?"Disponible":"Emprunté"}</p>
          <h2 className="mt-1 font-display text-xl text-iua-navy">{i.title}</h2>
          <p className="text-sm text-iua-muted">{i.author}</p>
          <p className="mt-2 text-xs text-iua-muted">{i.subject_tags}</p>
          {i.url && <a href={i.url} className="mt-3 inline-flex text-sm font-semibold text-iua-cyan" target="_blank" rel="noreferrer">Lire →</a>}
        </article>
      ))}</div>
    </PortalShell>
  );
}
