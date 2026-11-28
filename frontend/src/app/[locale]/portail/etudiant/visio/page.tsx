"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type M = { id: string; title: string; subject_name?: string; jitsi_url: string; scheduled_at: string | null };
export default function Page() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<M[]>([]);
  useEffect(() => { if (!ready||!token) return; apiGet<Page<M>>("/student/meetings/", token).then(d=>setItems(unwrapList(d))); }, [ready,token]);
  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.visio")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Rejoignez les salles Jitsi de vos enseignants.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">{items.map(m=>(
        <article key={m.id} className="rounded-xl bg-iua-navy p-5 text-white shadow-soft">
          <h2 className="font-display text-xl">{m.title}</h2>
          <p className="mt-1 text-sm text-white/70">{m.subject_name}</p>
          <a href={m.jitsi_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-md bg-iua-sun px-4 py-2 text-sm font-semibold text-iua-navy">Rejoindre</a>
        </article>
      ))}</div>
      {items.length===0 && <p className="mt-8 text-sm text-iua-muted">Aucune visio active.</p>}
    </PortalShell>
  );
}
