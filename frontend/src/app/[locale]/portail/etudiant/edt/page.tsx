"use client";

import { useTranslations } from "next-intl";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Slot = { id: string; subject_name?: string; weekday: number; weekday_label?: string; start_time: string; end_time: string; room: string; jitsi_room?: string };
const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

export default function StudentEdtPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Page<Slot>>("/student/schedule/?page_size=100", token).then((d) => setSlots(unwrapList(d))).catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [ready, token]);
  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.student.edt")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Vos créneaux de cours par jour — salles et liens visio.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DAYS.slice(0,6).map((day, idx) => (
          <section key={day} className="rounded-xl bg-white p-4 shadow-soft">
            <h2 className="font-display text-lg text-iua-navy">{day}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {slots.filter((s) => s.weekday === idx).map((s) => (
                <li key={s.id} className="rounded-md bg-iua-mist px-3 py-2">
                  <p className="font-semibold text-iua-navy">{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</p>
                  <p>{s.subject_name}</p>
                  <p className="text-xs text-iua-muted">{s.room || "Salle —"}</p>
                </li>
              ))}
              {slots.filter((s) => s.weekday === idx).length === 0 && <li className="text-xs text-iua-muted">Aucun cours</li>}
            </ul>
          </section>
        ))}
      </div>
    </PortalShell>
  );
}
