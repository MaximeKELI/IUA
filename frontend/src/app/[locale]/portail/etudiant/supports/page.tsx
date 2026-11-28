"use client";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type Item = { id: string; title: string; kind: string; description: string; url: string; subject_name?: string };
export default function Page() {
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!ready||!token) return; apiGet<Page<Item>>("/student/materials/?page_size=100", token).then(d=>setItems(unwrapList(d))).catch(e=>setError(e instanceof Error?e.message:"Erreur")); }, [ready,token]);
  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">Supports de cours</h1>
      <p className="mt-2 text-sm text-iua-muted">PDF, slides et liens déposés par vos enseignants.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-4 md:grid-cols-2">{items.map(i => (
        <article key={i.id} className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase text-iua-cyan">{i.kind} · {i.subject_name}</p>
          <h2 className="mt-1 font-display text-xl text-iua-navy">{i.title}</h2>
          <p className="mt-2 text-sm text-iua-muted">{i.description}</p>
          {i.url && <a href={i.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-iua-cyan">Ouvrir →</a>}
        </article>
      ))}</div>
      {items.length===0 && !error && <p className="mt-8 text-sm text-iua-muted">Aucun support pour le moment.</p>}
    </PortalShell>
  );
}
