"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { Link } from "@/i18n/navigation";
import { studentNav } from "@/lib/navigation";

const STORAGE_KEY = "iua.arrival.checklist.v1";

const DEFAULT_ITEMS = [
  { id: "visa", label: "Visa / titre de séjour validé" },
  { id: "housing", label: "Logement confirmé (campus ou privé)" },
  { id: "insurance", label: "Assurance santé / voyage" },
  { id: "ri", label: "Rendez-vous Bureau relations internationales" },
  { id: "portal", label: "Compte Digital Campus activé" },
  { id: "tuition", label: "Paiement scolarité / échéancier" },
  { id: "card", label: "Carte étudiante demandée" },
];

export default function ArrivalChecklistPage() {
  const tPortal = useTranslations("portal");
  const tArrival = useTranslations("arrival");
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const publicItems = (tArrival.raw("items") as string[]) || [];
  const completed = DEFAULT_ITEMS.filter((i) => done[i.id]).length;

  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("student.arrival")}</h1>
      <p className="mt-2 text-sm text-iua-muted">
        {tArrival("lead")} Progression : {completed}/{DEFAULT_ITEMS.length}.
      </p>

      <ul className="mt-8 space-y-3">
        {DEFAULT_ITEMS.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-4 shadow-soft">
              <input
                type="checkbox"
                checked={!!done[item.id]}
                onChange={() => toggle(item.id)}
                className="mt-1"
              />
              <span className={done[item.id] ? "text-iua-muted line-through" : "text-iua-navy"}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {publicItems.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl text-iua-navy">Rappel aéroport → campus</h2>
          <ol className="mt-4 space-y-2">
            {publicItems.map((item, i) => (
              <li key={item} className="flex gap-3 text-sm text-iua-navy">
                <span className="font-mono text-iua-cyan">{String(i + 1).padStart(2, "0")}</span>
                {item}
              </li>
            ))}
          </ol>
        </section>
      )}

      <Link
        href="/international/arrivee"
        className="mt-8 inline-flex text-sm font-semibold text-iua-cyan"
      >
        Guide public d&apos;arrivée →
      </Link>
    </PortalShell>
  );
}
