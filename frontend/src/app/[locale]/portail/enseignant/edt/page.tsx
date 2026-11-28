"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useTeacherAssignments } from "@/lib/teacher";

type Slot = {
  id: string;
  subject: string;
  subject_name?: string;
  academic_year: string;
  weekday: number;
  weekday_label?: string;
  start_time: string;
  end_time: string;
  room: string;
  jitsi_room: string;
};

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function EdtPage() {
  const { token, ready, assignments } = useTeacherAssignments();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [form, setForm] = useState({
    subject: "",
    weekday: "0",
    start_time: "08:00",
    end_time: "10:00",
    room: "",
    jitsi_room: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    const data = await apiGet<Page<Slot>>("/schedule-slots/?page_size=100", token);
    setSlots(unwrapList(data));
  }

  useEffect(() => {
    if (ready && token) void reload().catch((e) => setError(String(e.message || e)));
    if (!form.subject && assignments[0]) setForm((f) => ({ ...f, subject: assignments[0].subject }));
  }, [ready, token, assignments]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const a = assignments.find((x) => x.subject === form.subject);
    if (!a) return;
    setError(null);
    try {
      await apiSend("/schedule-slots/", token, "POST", {
        ...form,
        weekday: Number(form.weekday),
        academic_year: a.academic_year,
      });
      clearApiMemoryCache();
      setOk("Créneau ajouté.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">Emploi du temps</h1>
      <p className="mt-2 text-sm text-iua-muted">Vos créneaux hebdomadaires, salles et lien visio associé.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <form onSubmit={onSubmit} className="mt-8 grid gap-3 rounded-xl bg-white p-5 shadow-soft md:grid-cols-3">
        <label className="text-sm md:col-span-3">
          <span className="mb-1 block text-iua-muted">Matière</span>
          <select
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.subject}>
                {a.subject_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-iua-muted">Jour</span>
          <select
            value={form.weekday}
            onChange={(e) => setForm({ ...form, weekday: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-iua-muted">Début</span>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-iua-muted">Fin</span>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-iua-muted">Salle</span>
          <input
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-iua-muted">Salle Jitsi (optionnel)</span>
          <input
            value={form.jitsi_room}
            onChange={(e) => setForm({ ...form, jitsi_room: e.target.value })}
            placeholder="IUA-INFO-L3"
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
          />
        </label>
        <div className="md:col-span-3">
          <button type="submit" className="rounded-md bg-iua-navy px-5 py-2.5 text-sm font-semibold text-white">
            Ajouter le créneau
          </button>
        </div>
      </form>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DAYS.slice(0, 6).map((day, idx) => (
          <section key={day} className="rounded-xl bg-white p-4 shadow-soft">
            <h2 className="font-display text-lg text-iua-navy">{day}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {slots
                .filter((s) => s.weekday === idx)
                .map((s) => (
                  <li key={s.id} className="rounded-md bg-iua-mist px-3 py-2">
                    <p className="font-semibold text-iua-navy">
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </p>
                    <p className="text-iua-muted">{s.subject_name}</p>
                    <p className="text-xs text-iua-muted">{s.room || "Salle —"}</p>
                  </li>
                ))}
              {slots.filter((s) => s.weekday === idx).length === 0 && (
                <li className="text-xs text-iua-muted">Aucun créneau</li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </PortalShell>
  );
}
