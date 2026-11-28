"use client";

import { useEffect, useId, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  /** destructive = red confirm (logout / reject) */
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Accessible confirmation dialog.
 * Cancel is focused by default to reduce accidental destructive actions.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-red-700 text-white hover:bg-red-800 disabled:opacity-60"
      : "bg-iua-navy text-white hover:bg-iua-blue disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-iua-navy/45 backdrop-blur-[2px] transition"
        aria-label={cancelLabel}
        disabled={busy}
        onClick={() => {
          if (!busy) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-[81] w-full max-w-md animate-[fadeUp_0.2s_ease_both] rounded-2xl bg-white p-5 shadow-soft ring-1 ring-iua-navy/10 sm:p-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-iua-cyan">Confirmation</p>
        <h2 id={titleId} className="mt-2 font-display text-2xl text-iua-navy">
          {title}
        </h2>
        <p id={descId} className="mt-2 text-sm leading-relaxed text-iua-muted">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-md border border-iua-navy/15 px-4 py-2.5 text-sm font-semibold text-iua-navy transition hover:bg-iua-mist disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${confirmClass}`}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
