"use client";

import { useTranslations } from "next-intl";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type Ann = {
  id: string;
  title: string;
  body: string;
  audience: string;
  is_published: boolean;
};

export default function AdminAnnoncesPage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];
  const [items, setItems] = useState<Ann[]>([]);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setItems(unwrapList(await apiGet<Page<Ann>>("/ops/announcements/", token)));
  }

  useEffect(() => {
    if (ready && token) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await apiSend("/ops/announcements/", token, "POST", { ...form, is_published: true });
    setMsg("Annonce publiée.");
    setForm({ title: "", body: "", audience: "all" });
    await load();
  }

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <h1 className="font-display text-3xl text-iua-navy">{tPortal("pages.admin.annonces")}</h1>
      <p className="mt-2 text-sm text-iua-muted">Publier une communication institutionnelle.</p>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-3 rounded-xl bg-white p-5 shadow-soft">
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Titre"
          className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <textarea
          required
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={3}
          placeholder="Message"
          className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        />
        <select
          value={form.audience}
          onChange={(e) => setForm({ ...form, audience: e.target.value })}
          className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
        >
          <option value="all">Tous</option>
          <option value="students">Étudiants</option>
          <option value="staff">Personnel</option>
        </select>
        <button type="submit" className="rounded-md bg-iua-navy px-4 py-2 text-sm font-semibold text-white">
          Publier
        </button>
      </form>
      <ul className="mt-8 divide-y divide-iua-navy/10 rounded-xl bg-white text-sm shadow-soft">
        {items.map((a) => (
          <li key={a.id} className="px-5 py-3">
            <p className="font-medium text-iua-navy">{a.title}</p>
            <p className="text-iua-muted">
              {a.audience} · {a.body}
            </p>
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
