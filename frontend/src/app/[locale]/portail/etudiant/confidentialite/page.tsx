"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";

export default function StudentPrivacyPage() {
  const t = useTranslations("portal");
  const ts = useTranslations("portal.student");
  const tc = useTranslations("common");
  const { token, ready } = useAuthToken();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [eraseOpen, setEraseOpen] = useState(false);

  async function exportData() {
    if (!ready) return;
    setBusy(true);
    setMsg(null);
    try {
      const data = await apiGet<Record<string, unknown>>("/privacy/export/", token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `iua-dsar-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg(ts("privacyExportOk"));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function requestErase() {
    setBusy(true);
    try {
      await apiSend("/privacy/erase-request/", token, "POST", { reason: "user_request" });
      setMsg(ts("privacyEraseOk"));
      setEraseOpen(false);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalShell title={t("student.space")} nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">{t("pages.student.confidentialite")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">{ts("privacyLead")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => void exportData()}
          className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {tc("download")}
        </button>
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => setEraseOpen(true)}
          className="rounded-md border border-red-700/30 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-60"
        >
          {tc("confirm")}
        </button>
      </div>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      <ConfirmDialog
        open={eraseOpen}
        title={t("pages.student.confidentialite")}
        description={ts("privacyEraseBody")}
        confirmLabel={tc("confirm")}
        cancelLabel={tc("cancel")}
        tone="danger"
        busy={busy}
        onCancel={() => setEraseOpen(false)}
        onConfirm={() => void requestErase()}
      />
    </PortalShell>
  );
}
