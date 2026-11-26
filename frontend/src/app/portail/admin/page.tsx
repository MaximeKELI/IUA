"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type AdminDashboard = {
  stats: {
    users: number;
    students: number;
    faculties: number;
    programs: number;
    enrollments: number;
  };
};

export default function AdminPortalPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiGet<AdminDashboard>("/portal/admin/dashboard/", token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  return (
    <PortalShell title="Administration">
      <h1 className="font-display text-3xl text-iua-navy">Pilotage administratif</h1>
      <p className="mt-2 text-iua-ink/65">Vue consolidée des référentiels et effectifs.</p>
      {error && <p className="mt-6 text-red-700">{error}</p>}
      {data && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data.stats).map(([key, value]) => (
            <div key={key} className="border-t border-iua-navy/15 pt-4">
              <p className="text-xs uppercase tracking-[0.14em] text-iua-navy/45">{key}</p>
              <p className="mt-2 font-display text-3xl text-iua-navy">{value}</p>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
