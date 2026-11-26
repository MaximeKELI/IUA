"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthHeaderActions } from "@/components/AuthHeaderActions";
import { BrandLogo } from "@/components/BrandLogo";
import { getAccessToken, getStoredUser, resolveHomePath } from "@/lib/auth";
import { publicNav } from "@/lib/navigation";

export function SiteHeader({ variant = "overlay" }: { variant?: "overlay" | "solid" }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const solid = variant === "solid" || scrolled;

  useEffect(() => {
    if (variant === "solid") return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  return (
    <header
      className={`animate-[fadeUp_0.45s_ease_both] ${
        solid
          ? "fixed inset-x-0 top-0 z-40 border-b border-iua-navy/10 bg-white/95 shadow-soft backdrop-blur-md"
          : "absolute inset-x-0 top-0 z-40"
      }`}
    >
      <div
        className={`hidden border-b px-6 py-2 text-xs sm:block ${
          solid ? "border-iua-navy/10 bg-iua-navy text-white/80" : "border-white/10 text-white/75"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p>
            <a href="mailto:info@iua-ci.org" className="transition hover:text-white">
              info@iua-ci.org
            </a>
            <span className="mx-3 opacity-40">·</span>
            <a href="tel:+2252722422265" className="transition hover:text-white">
              +225 27 224 222 65
            </a>
          </p>
          <p className="tracking-[0.12em] uppercase">Abidjan · Côte d&apos;Ivoire</p>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <BrandLogo
            variant={solid ? "color" : "white"}
            priority
            className="h-10 w-auto transition duration-300 group-hover:scale-[1.02] sm:h-11"
          />
          <span
            className={`hidden border-l pl-3 text-[11px] uppercase leading-tight tracking-[0.16em] sm:block ${
              solid ? "border-iua-navy/15 text-iua-navy/55" : "border-white/25 text-white/70"
            }`}
          >
            Digital
            <br />
            Campus
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {publicNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={`relative text-sm font-medium transition after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-iua-cyan after:transition-all hover:after:w-full ${
                solid ? "text-iua-navy/75 hover:text-iua-navy" : "text-white/85 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <AuthHeaderActions solid={solid} />
          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md lg:hidden ${
              solid ? "bg-iua-mist text-iua-navy" : "bg-white/15 text-white"
            }`}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-lg">{open ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div
          className={`border-t px-6 py-4 lg:hidden animate-[fadeUp_0.25s_ease_both] ${
            solid ? "border-iua-navy/10 bg-white" : "border-white/10 bg-iua-navy/95 text-white"
          }`}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-3">
            {publicNav.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="block py-2 text-base font-semibold"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
                {"children" in item && item.children && (
                  <div className="ml-3 flex flex-col gap-1 border-l border-current/15 pl-3 text-sm opacity-80">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} onClick={() => setOpen(false)}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {getAccessToken() ? (
              <Link
                href={resolveHomePath(getStoredUser()?.roles || [])}
                className="pt-2 font-semibold"
                onClick={() => setOpen(false)}
              >
                Mon espace
              </Link>
            ) : (
              <Link href="/connexion" className="pt-2 font-semibold" onClick={() => setOpen(false)}>
                Connexion au portail
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
