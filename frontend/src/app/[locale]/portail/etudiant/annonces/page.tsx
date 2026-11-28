"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type A = { id: string; title: string; body: string; subject_name?: string; is_pinned: boolean; created_at: string };
export default function Page() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<A[]>([]);
  useEffect(() => { if (!ready||!token) return; apiGet<Page<A>>("/student/announcements/", token).then(d=>setItems(unwrapList(d))); }, [ready,token]);
  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.annonces")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Messages de vos enseignants et de la classe.</p>
      <ul className="mt-8 space-y-3">{items.map(a=>(
        <li key={a.id} className="rounded-xl bg-white p-5 shadow-soft">
          <div className="flex gap-2 items-center">{a.is_pinned && <span className="rounded bg-iua-sun/30 px-2 py-0.5 text-[10px] font-semibold uppercase">Épinglée</span>}<span className="text-xs text-iua-muted">{a.subject_name}</span></div>
          <h2 className="mt-2 font-display text-xl text-iua-navy">{a.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-iua-muted">{a.body}</p>
        </li>
      ))}</ul>
    </PortalShell>
  );
}
