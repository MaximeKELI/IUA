"use client";

import { useTranslations } from "next-intl";

const WA_NUMBER = "2252722422265";
const WA_TEXT = encodeURIComponent(
  "Hello IUA International Office — I need help with admission / visa (EN/FR).",
);

export function WhatsAppFloat() {
  const t = useTranslations("common");

  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 end-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-105"
      aria-label={t("whatsapp")}
    >
      <span aria-hidden className="text-base">
        ✦
      </span>
      <span className="hidden sm:inline">{t("whatsapp")}</span>
    </a>
  );
}
