"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { EmptyState, ErrorState, PageLoading } from "@/components/ux";
import { apiGet } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type CalEvent = {
  id: string;
  kind: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string;
  description: string;
};

const KIND: Record<string, string> = {
  schedule: "Cours",
  exam: "Examen",
  homework: "Devoir",
};

export default function StudentCalendarPage() {
  const tPortal = useTranslations("portal");
  const locale = useLocale();
  const { token, ready } = useAuthToken();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    setLoading(true);
    apiGet<{ events: CalEvent[] }>("/calendar/?weeks=8", token)
      .then((d) => setEvents(d.events || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [ready, token]);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/$/, "");
  const access = getAccessToken();
  const icsHref = `${apiBase}/calendar.ics?weeks=8`;

  return (
    <PortalShell title={tPortal("student.space")} nav={studentNav}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-iua-navy">{tPortal("student.calendar")}</h1>
          <p className="mt-2 text-sm text-iua-muted">
            EDT, examens et devoirs — export ICS pour votre agenda.
          </p>
        </div>
        <a
          href={icsHref}
          className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white"
          onClick={(e) => {
            // Authenticated download via fetch + blob when cookie/token needed
            e.preventDefault();
            if (!access) return;
            fetch(icsHref, {
              headers: { Authorization: `Bearer ${access}` },
              credentials: "include",
            })
              .then((r) => r.blob())
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "iua-campus.ics";
                a.click();
                URL.revokeObjectURL(url);
              })
              .catch((err) => setError(err instanceof Error ? err.message : "ICS indisponible"));
          }}
        >
          S&apos;abonner (ICS)
        </a>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}
      {loading ? (
        <PageLoading />
      ) : events.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Aucun événement sur les prochaines semaines." />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {events.map((ev) => (
            <li key={ev.id} className="rounded-xl bg-white p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wide text-iua-muted">
                {KIND[ev.kind] || ev.kind}
                {ev.location ? ` · ${ev.location}` : ""}
              </p>
              <p className="mt-1 font-semibold text-iua-navy">{ev.title}</p>
              <p className="mt-1 text-sm text-iua-muted">
                {new Date(ev.starts_at).toLocaleString(locale)}
                {ev.description ? ` · ${ev.description}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  );
}
