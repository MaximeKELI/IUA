"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-iua-navy/10 ${className}`}
      aria-hidden="true"
    />
  );
}

export function PageLoading({ label }: { label?: string }) {
  const tc = useTranslations("common");
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-iua-muted" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-iua-navy/20 border-t-iua-cyan" />
      <p className="text-sm">{label || tc("loading")}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-8 text-center shadow-soft">
      <p className="font-display text-xl text-iua-navy">{title}</p>
      {description && <p className="mt-2 text-sm text-iua-muted">{description}</p>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const tc = useTranslations("common");
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md bg-iua-navy px-3 py-2 text-xs font-semibold text-white"
        >
          {tc("retry")}
        </button>
      )}
    </div>
  );
}

export type Crumb = { href?: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-iua-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-iua-navy">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "font-semibold text-iua-navy" : undefined} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PortalPageHeader({
  title,
  lead,
  crumbs,
  actions,
}: {
  title: string;
  lead?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-iua-navy">{title}</h1>
          {lead && <p className="mt-2 max-w-2xl text-sm text-iua-muted">{lead}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}
