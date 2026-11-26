import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-sm font-semibold tracking-wide text-white backdrop-blur">
            IUA
          </span>
          <div>
            <p className="font-display text-lg leading-none text-white">Digital Campus</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/60">
              Institut Universitaire d&apos;Abidjan
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/80">
          <Link href="/formations" className="hidden transition hover:text-white sm:inline">
            Formations
          </Link>
          <Link href="/admissions" className="hidden transition hover:text-white sm:inline">
            Admissions
          </Link>
          <Link
            href="/connexion"
            className="rounded-full bg-iua-teal px-5 py-2.5 font-medium text-white shadow-lg shadow-teal-900/30 transition hover:bg-teal-600"
          >
            Connexion
          </Link>
        </nav>
      </div>
    </header>
  );
}
