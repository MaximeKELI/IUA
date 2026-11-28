"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/$/, "");

export function InternationalApplicationForm() {
  const t = useTranslations("admissions");
  const tc = useTranslations("common");
  const [sent, setSent] = useState(false);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      country: String(fd.get("country") || "").trim(),
      nationality: String(fd.get("nationality") || "").trim(),
      passport: String(fd.get("passport") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      program: String(fd.get("program") || "").trim(),
      diploma: String(fd.get("diploma") || "").trim(),
      payment_preference: String(fd.get("payment") || "momo"),
    };
    try {
      const res = await fetch(`${API_URL}/admissions/applications/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : `Échec d'envoi (${res.status})`,
        );
      }
      if (typeof data?.tracking_token === "string") {
        setTrackingToken(data.tracking_token);
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec réseau");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-3 rounded-xl border border-iua-cyan/30 bg-white p-6 text-sm text-iua-navy shadow-soft">
        <p>{t("note")}</p>
        {trackingToken && (
          <p>
            Token de suivi :{" "}
            <code className="rounded bg-iua-mist px-2 py-1 font-mono text-xs">{trackingToken}</code>
            <br />
            <a
              className="mt-2 inline-block font-semibold text-iua-cyan"
              href={`/international/suivi?token=${encodeURIComponent(trackingToken)}`}
            >
              Suivre ma candidature →
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl bg-white p-6 shadow-soft md:grid-cols-2">
      {error && (
        <p className="md:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <label className="block text-sm">
        <span className="mb-1 block text-iua-muted">
          {t("fieldCountry")} · {tc("required")}
        </span>
        <input required name="country" className="w-full rounded-md border border-iua-navy/15 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-iua-muted">
          {t("fieldNationality")} · {tc("required")}
        </span>
        <input required name="nationality" className="w-full rounded-md border border-iua-navy/15 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-iua-muted">
          {t("fieldPassport")} · {tc("required")}
        </span>
        <input required name="passport" className="w-full rounded-md border border-iua-navy/15 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-iua-muted">
          {t("fieldPhone")} · {tc("required")}
        </span>
        <input
          required
          name="phone"
          type="tel"
          placeholder="+225 …"
          className="w-full rounded-md border border-iua-navy/15 px-3 py-2"
        />
      </label>
      <label className="block text-sm md:col-span-2">
        <span className="mb-1 block text-iua-muted">
          {t("fieldEmail")} · {tc("required")}
        </span>
        <input required name="email" type="email" className="w-full rounded-md border border-iua-navy/15 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-iua-muted">{t("fieldProgram")}</span>
        <input name="program" className="w-full rounded-md border border-iua-navy/15 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-iua-muted">{t("fieldDiploma")}</span>
        <input name="diploma" className="w-full rounded-md border border-iua-navy/15 px-3 py-2" />
      </label>
      <label className="block text-sm md:col-span-2">
        <span className="mb-1 block text-iua-muted">{t("fieldPayment")}</span>
        <select name="payment" className="w-full rounded-md border border-iua-navy/15 px-3 py-2">
          <option value="momo">{t("payMom")}</option>
          <option value="card">{t("payCard")}</option>
          <option value="wise">{t("payWise")}</option>
        </select>
      </label>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-iua-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-iua-blue disabled:opacity-60"
        >
          {busy ? tc("loading") : t("submitIntl")}
        </button>
      </div>
    </form>
  );
}
