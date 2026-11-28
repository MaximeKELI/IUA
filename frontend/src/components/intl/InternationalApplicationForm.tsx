"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

export function InternationalApplicationForm() {
  const t = useTranslations("admissions");
  const tc = useTranslations("common");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-iua-cyan/30 bg-white p-6 text-sm text-iua-navy shadow-soft">
        ✓ {t("note")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl bg-white p-6 shadow-soft md:grid-cols-2">
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
          className="rounded-md bg-iua-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-iua-blue"
        >
          {t("submitIntl")}
        </button>
      </div>
    </form>
  );
}
