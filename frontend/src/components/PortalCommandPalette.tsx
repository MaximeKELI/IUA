"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { PortalGroup } from "@/lib/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  nav: PortalGroup[];
  tr: (key: string) => string;
};

export function PortalCommandPalette({ open, onClose, nav, tr }: Props) {
  const tc = useTranslations("common");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  const links = useMemo(
    () =>
      nav.flatMap((g) =>
        g.links
          .filter((l) => l.status !== "soon")
          .map((l) => ({ href: l.href, label: tr(l.labelKey), group: tr(g.titleKey) })),
      ),
    [nav, tr],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return links.slice(0, 12);
    return links.filter(
      (l) => l.label.toLowerCase().includes(needle) || l.group.toLowerCase().includes(needle),
    ).slice(0, 12);
  }, [links, q]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-iua-navy/40 p-4 pt-[12vh]" role="presentation">
      <button type="button" className="absolute inset-0" aria-label={tc("close")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tc("search")}
        className="relative z-[91] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-iua-navy/10"
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tc("searchPlaceholder")}
          className="w-full border-b border-iua-navy/10 px-4 py-3 text-sm outline-none"
        />
        <ul className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-iua-muted">{tc("empty")}</li>
          )}
          {filtered.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-iua-mist"
                onClick={() => {
                  onClose();
                  router.push(item.href);
                }}
              >
                <span className="font-medium text-iua-navy">{item.label}</span>
                <span className="text-xs text-iua-muted">{item.group}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-iua-navy/10 px-4 py-2 text-[11px] text-iua-muted">
          Esc · {tc("close")}
        </p>
      </div>
    </div>
  );
}
