"use client";

import { FormEvent, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiSend } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

export default function ImportPage() {
  const { token } = useAuthToken();
  const roles = getStoredUser()?.roles || [];
  const [csv, setCsv] = useState(
    "email,first_name,last_name,student_number\netudiant2@demo.iua.local,Awa,Koné,IUA-2025-0002",
  );
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const res = await apiSend<{ preview: Record<string, string>[]; total_lines: number }>(
      "/ops/import-preview/",
      token,
      "POST",
      { csv },
    );
    setPreview(res.preview || []);
    setMsg(`Prévisualisation : ${res.total_lines} ligne(s) — aucune écriture effectuée.`);
  }

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <h1 className="font-display text-3xl text-iua-navy">Import CSV étudiants</h1>
      <p className="mt-2 text-sm text-iua-muted">
        Collez un CSV pour prévisualiser (sécurisé, sans écriture).
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={6}
          className="w-full max-w-2xl rounded-md border border-iua-navy/15 px-3 py-2 font-mono text-xs"
        />
        <button type="submit" className="rounded-md bg-iua-navy px-4 py-2 text-sm font-semibold text-white">
          Prévisualiser
        </button>
      </form>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      {preview.length > 0 && (
        <pre className="mt-4 max-w-2xl overflow-auto rounded-xl bg-white p-4 text-xs shadow-soft">
          {JSON.stringify(preview, null, 2)}
        </pre>
      )}
    </PortalShell>
  );
}
