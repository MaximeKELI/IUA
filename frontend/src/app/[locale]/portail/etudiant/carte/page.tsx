"use client";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGetCached } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type Dash = { full_name?: string; profile: { student_number: string | null; program: string | null; cohort: string | null; level: string | null; status?: string | null; email?: string } };
export default function Page() {
  const { token, ready } = useAuthToken();
  const [data, setData] = useState<Dash | null>(null);
  useEffect(()=>{ if(!ready||!token) return; apiGetCached<Dash>("/portal/student/dashboard/", token, 12000).then(setData); },[ready,token]);
  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">Carte / profil</h1>
      <p className="mt-2 text-sm text-iua-muted">Votre identité numérique IUA — à présenter sur le campus.</p>
      {data && (
        <div className="mt-8 max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-iua-navy to-iua-blue p-6 text-white shadow-soft">
          <p className="text-xs uppercase tracking-[0.2em] text-iua-cyan">Institut Universitaire d&apos;Abidjan</p>
          <p className="mt-6 font-display text-3xl">{data.full_name}</p>
          <p className="mt-2 font-mono text-lg text-iua-sun">{data.profile.student_number || "—"}</p>
          <div className="mt-6 space-y-1 text-sm text-white/80">
            <p>{data.profile.program}</p>
            <p>{data.profile.cohort} · {data.profile.level}</p>
            <p>{data.profile.email}</p>
            <p className="uppercase tracking-wide text-xs text-white/50">{data.profile.status}</p>
          </div>
          <p className="mt-8 text-[10px] uppercase tracking-[0.16em] text-white/40">Digital Campus · Carte étudiante</p>
        </div>
      )}
    </PortalShell>
  );
}
