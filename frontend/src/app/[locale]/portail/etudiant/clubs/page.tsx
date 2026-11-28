"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type Club = { id: string; name: string; category: string; description: string; meeting_info: string; members_count?: number; joined?: boolean };
export default function Page() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Club[]>([]);
  async function reload(){ if(!token) return; setItems(unwrapList(await apiGet<Page<Club>>("/student/clubs/", token))); }
  useEffect(()=>{ if(ready&&token) void reload(); },[ready,token]);
  async function toggle(c: Club){ if(!token) return; await apiSend(`/student/clubs/${c.id}/${c.joined?"leave":"join"}/`, token, "POST", {}); clearApiMemoryCache(); await reload(); }
  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.clubs")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Rejoignez les clubs du campus.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">{items.map(c=>(
        <article key={c.id} className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase text-iua-cyan">{c.category}</p>
          <h2 className="mt-1 font-display text-xl text-iua-navy">{c.name}</h2>
          <p className="mt-2 text-sm text-iua-muted">{c.description}</p>
          <p className="mt-2 text-xs text-iua-muted">{c.meeting_info} · {c.members_count??0} membres</p>
          <button type="button" onClick={()=>void toggle(c)} className={`mt-4 rounded-md px-4 py-2 text-sm font-semibold ${c.joined?"border border-iua-navy/15 text-iua-navy":"bg-iua-navy text-white"}`}>{c.joined?"Quitter":"Rejoindre"}</button>
        </article>
      ))}</div>
    </PortalShell>
  );
}
