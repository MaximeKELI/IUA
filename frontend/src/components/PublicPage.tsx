import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function PublicPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[100svh] bg-iua-mist">
      <SiteHeader variant="solid" />
      <section className="relative overflow-hidden border-b border-iua-navy/10 bg-white">
        <div className="pointer-events-none absolute -end-16 top-0 h-40 w-40 rounded-full bg-iua-cyan/15 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6 py-14 pt-28">
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.2em] text-iua-cyan animate-[fadeUp_0.4s_ease_both]">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 font-display text-4xl text-iua-navy animate-[fadeUp_0.5s_ease_both]">
            {title}
          </h1>
          {lead && (
            <p className="mt-4 max-w-2xl text-iua-muted animate-[fadeUp_0.6s_ease_both]">{lead}</p>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-6 py-12 content-auto">{children}</div>
      <SiteFooter />
    </main>
  );
}
