"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { directionNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Row = {
  id: string;
  subject: string;
  teacher: string;
  year: string;
  signed_at: string | null;
};

export default function PvPage() {
  const { token, ready } = useAuthToken();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Page<Row> | { results: Row[] }>("/direction/pv/", token).then((d) =>
      setRows(unwrapList(d as Page<Row>)),
    );
  }, [ready, token]);

  return (
    <PortalShell title="Direction" nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">PV & signatures</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Procès-verbaux de notes signés par les enseignants.
      </p>
      <ul className="mt-8 divide-y divide-iua-navy/10 rounded-xl bg-white text-sm shadow-soft">
        {rows.map((r) => (
          <li key={r.id} className="flex justify-between gap-3 px-5 py-3">
            <span>
              <strong>{r.subject}</strong> · {r.teacher} · {r.year}
            </span>
            <span className="text-iua-muted">
              {r.signed_at ? new Date(r.signed_at).toLocaleString("fr-FR") : "—"}
            </span>
          </li>
        ))}
        {!rows.length && <li className="px-5 py-4 text-iua-muted">Aucun PV signé.</li>}
      </ul>
    </PortalShell>
  );
}
