"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type R = { id: string; date: string; subject: string; status: string; comment: string; topic: string };
export default function Page() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<R[]>([]);
  useEffect(() => { if (!ready||!token) return; apiGet<R[]>("/student/attendance/", token).then(setItems); }, [ready,token]);
  const abs = items.filter(i=>i.status==="absent").length;
  const late = items.filter(i=>i.status==="late").length;
  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.absences")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Historique d&apos;émargement : absences, retards et séances.</p>
      <div className="mt-6 flex gap-3"><span className="rounded-md bg-white px-4 py-2 shadow-soft text-sm"><strong>{abs}</strong> absences</span><span className="rounded-md bg-white px-4 py-2 shadow-soft text-sm"><strong>{late}</strong> retards</span></div>
      <ul className="mt-8 divide-y divide-iua-navy/10 rounded-xl bg-white shadow-soft">{items.length===0 && <li className="p-5 text-sm text-iua-muted">Aucune anomalie.</li>}
        {items.map(i=>(
          <li key={i.id} className="flex justify-between gap-3 px-5 py-3 text-sm">
            <div><p className="font-medium text-iua-navy">{i.subject}</p><p className="text-xs text-iua-muted">{i.date} · {i.topic||"Séance"}</p></div>
            <span className="uppercase text-xs text-iua-muted">{i.status}</span>
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
