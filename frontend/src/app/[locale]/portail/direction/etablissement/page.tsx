"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet } from "@/lib/api";
import { directionNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

type Inst = {
  name: string;
  code: string;
  city: string;
  country: string;
  address: string;
  email: string;
  phone: string;
  website: string;
};

export default function InstitutionPage() {
  const { token, ready } = useAuthToken();
  const [inst, setInst] = useState<Inst | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiGet<Inst>("/direction/institution/", token).then(setInst);
  }, [ready, token]);

  return (
    <PortalShell title="Direction" nav={directionNav}>
      <h1 className="font-display text-3xl text-iua-navy">Fiche établissement</h1>
      <p className="mt-2 text-sm text-iua-muted">Identité officielle de l&apos;IUA.</p>
      {inst && (
        <dl className="mt-8 grid gap-4 rounded-xl bg-white p-6 text-sm shadow-soft sm:grid-cols-2">
          {(
            [
              ["Nom", inst.name],
              ["Code", inst.code],
              ["Ville", `${inst.city} · ${inst.country}`],
              ["Adresse", inst.address],
              ["E-mail", inst.email],
              ["Téléphone", inst.phone],
              ["Site", inst.website],
            ] as const
          ).map(([l, v]) => (
            <div key={l}>
              <dt className="text-xs uppercase text-iua-muted">{l}</dt>
              <dd className="mt-1 font-medium text-iua-navy">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </PortalShell>
  );
}
