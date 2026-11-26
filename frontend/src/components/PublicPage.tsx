"use client";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal, motion } from "@/components/motion";

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
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-iua-cyan/15 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6 py-14 pt-28">
          {eyebrow && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs uppercase tracking-[0.2em] text-iua-cyan"
            >
              {eyebrow}
            </motion.p>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.55 }}
            className="mt-3 font-display text-4xl text-iua-navy"
          >
            {title}
          </motion.h1>
          {lead && (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.55 }}
              className="mt-4 max-w-2xl text-iua-muted"
            >
              {lead}
            </motion.p>
          )}
        </div>
      </section>
      <Reveal className="mx-auto max-w-6xl px-6 py-12" delay={0.1}>
        {children}
      </Reveal>
      <SiteFooter />
    </main>
  );
}
