"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { readStudentOfflineNotes, writeStudentOfflineNotes } from "@/lib/student";
import { useAuthToken } from "@/lib/useAuthToken";

type Grade = {
  id: string;
  subject_name: string;
  label: string;
  score: string | null;
  max_score: string;
  kind: string;
};

export default function StudentOfflinePage() {
  const t = useTranslations("portal.student");
  const tc = useTranslations("common");
  const { token, ready } = useAuthToken();
  const [online, setOnline] = useState(true);
  const [cached, setCached] = useState<Grade[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    setCached(readStudentOfflineNotes() as Grade[]);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function refreshCache() {
    if (!token || !navigator.onLine) {
      setMsg(t("cacheNeedOnline"));
      return;
    }
    const data = unwrapList(await apiGet<Page<Grade>>("/grades/?page_size=200", token));
    writeStudentOfflineNotes(data);
    setCached(data);
    setMsg(t("cacheUpdated", { count: data.length }));
  }

  function clearCache() {
    writeStudentOfflineNotes([]);
    setCached([]);
    setClearOpen(false);
    setMsg(t("noCachedGrades"));
  }

  return (
    <PortalShell title={t("space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{t("offline")}</h1>
      <p className="mt-2 text-sm text-iua-muted">{t("clearCacheBody")}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase text-iua-muted">{t("network")}</p>
          <p className={`mt-2 font-display text-2xl ${online ? "text-emerald-700" : "text-red-700"}`}>
            {online ? t("online") : t("offlineState")}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase text-iua-muted">{t("cachedGrades")}</p>
          <p className="mt-2 font-display text-2xl text-iua-navy">{cached.length}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-soft flex flex-col gap-2">
          <button
            type="button"
            disabled={!ready}
            onClick={() => void refreshCache()}
            className="rounded-md bg-iua-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {t("refreshCache")}
          </button>
          <button
            type="button"
            disabled={cached.length === 0}
            onClick={() => setClearOpen(true)}
            className="rounded-md border border-iua-navy/20 px-4 py-2 text-sm font-semibold text-iua-navy disabled:opacity-60"
          >
            {t("clearCache")}
          </button>
        </div>
      </div>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      <ul className="mt-8 divide-y divide-iua-navy/10 rounded-xl bg-white shadow-soft">
        {cached.length === 0 && (
          <li className="p-5 text-sm text-iua-muted">{t("noCachedGrades")}</li>
        )}
        {cached.map((g) => (
          <li key={g.id} className="flex justify-between px-5 py-3 text-sm">
            <span>
              {g.subject_name} · {g.label || g.kind}
            </span>
            <span>
              {g.score}/{g.max_score}
            </span>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={clearOpen}
        title={t("clearCacheTitle")}
        description={t("clearCacheBody")}
        confirmLabel={t("clearCache")}
        cancelLabel={tc("cancel")}
        tone="danger"
        onConfirm={clearCache}
        onCancel={() => setClearOpen(false)}
      />
    </PortalShell>
  );
}
