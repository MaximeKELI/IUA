"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useId, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import {
  apiLogin,
  apiMfaEnrollConfirm,
  apiMfaEnrollSetup,
  apiMfaVerify,
  apiPasswordResetRequest,
  syncSessionCookies,
} from "@/lib/api";
import { getAccessToken, getStoredUser, resolveHomePath, saveSession } from "@/lib/auth";

const DEMO_LOGIN = process.env.NEXT_PUBLIC_DEMO_LOGIN === "true";

export default function LoginPage() {
  const t = useTranslations("connexion");
  const tc = useTranslations("common");
  const router = useRouter();
  const errorId = useId();

  const presets = DEMO_LOGIN
    ? [
        { label: t("demoStudent"), email: "etudiant@demo.iua.local", password: "IuaDemoStudent2026!" },
        { label: t("demoTeacher"), email: "enseignant@demo.iua.local", password: "IuaDemoTeacher2026!" },
        { label: t("demoSecret"), email: "secretariat@demo.iua.local", password: "IuaDemoSecret2026!" },
        { label: t("demoDirection"), email: "direction@demo.iua.local", password: "IuaDemoDirection2026!" },
        { label: t("demoAdmin"), email: "admin@demo.iua.local", password: "IuaDemoAdmin2026!" },
      ]
    : [];

  const [email, setEmail] = useState(presets[0]?.email || "");
  const [password, setPassword] = useState(presets[0]?.password || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [enrollToken, setEnrollToken] = useState<string | null>(null);
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    if (!getAccessToken() && !getStoredUser()) {
      setChecking(false);
      return;
    }
    const user = getStoredUser();
    if (user?.roles?.length) {
      router.replace(resolveHomePath(user.roles));
      return;
    }
    setChecking(false);
  }, [router]);

  async function finishLogin(
    access: string | undefined,
    refresh: string | undefined,
    user: Parameters<typeof saveSession>[2],
  ) {
    saveSession(access || "", refresh || "", user);
    if (access && refresh && access !== "cookie") {
      await syncSessionCookies(access, refresh, user.roles);
    } else {
      await syncSessionCookies("", "", user.roles);
    }
    router.push(resolveHomePath(user.roles));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (forgotMode) {
        await apiPasswordResetRequest(email);
        setForgotSent(true);
        return;
      }
      if (enrollToken && enrollSecret) {
        const data = await apiMfaEnrollConfirm(enrollToken, mfaCode);
        await finishLogin(data.access, data.refresh, data.user);
        return;
      }
      if (mfaToken) {
        const data = await apiMfaVerify(mfaToken, mfaCode);
        await finishLogin(data.access, data.refresh, data.user);
        return;
      }
      const data = await apiLogin(email, password);
      if ("mfa_enrollment_required" in data && data.mfa_enrollment_required) {
        const token = data.mfa_enrollment_token;
        if (!token) {
          setError(data.message || t("mfaEnrollRequired"));
          return;
        }
        const setup = await apiMfaEnrollSetup(token);
        setEnrollToken(setup.mfa_enrollment_token || token);
        setEnrollSecret(setup.secret);
        setMfaCode("");
        return;
      }
      if ("mfa_required" in data && data.mfa_required) {
        setMfaToken(data.mfa_token);
        setMfaCode("");
        return;
      }
      if ("user" in data && data.user) {
        const full = data as { access?: string; refresh?: string; user: Parameters<typeof saveSession>[2] };
        await finishLogin(full.access, full.refresh, full.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-iua-mist text-iua-navy">
        {t("checking")}
      </main>
    );
  }

  const modeTitle = enrollSecret
    ? t("mfaEnrollTitle")
    : mfaToken
      ? t("titleMfa")
      : forgotMode
        ? t("forgot")
        : t("title");
  const modeLead = enrollSecret
    ? t("mfaEnrollLead")
    : mfaToken
      ? t("leadMfa")
      : forgotMode
        ? t("forgotSent")
        : t("lead");

  return (
    <main className="grid min-h-[100svh] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-iua-navy lg:block" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-[position:center_18%] opacity-55"
          style={{ backgroundImage: "url('/brand/campus-hero.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-iua-navy via-iua-navy/65 to-iua-navy/35" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <BrandLogo variant="white" priority className="h-12 w-auto" />
          <div className="animate-[fadeUp_0.5s_ease_both]">
            <p className="text-xs uppercase tracking-[0.22em] text-iua-cyan">{t("eyebrow")}</p>
            <h1 className="mt-3 max-w-md font-display text-4xl leading-tight">{t("heroTitle")}</h1>
            <p className="mt-4 max-w-sm text-sm text-white/70">{t("heroLead")}</p>
          </div>
        </div>
      </section>

      <section className="flex items-center bg-iua-mist px-6 py-12">
        <div className="mx-auto w-full max-w-md animate-[fadeUp_0.4s_ease_both]">
          <Link href="/" className="text-sm text-iua-muted transition hover:text-iua-navy">
            ← {t("backHome")}
          </Link>
          <div className="mt-8 lg:hidden">
            <BrandLogo className="h-11 w-auto" />
          </div>
          <h2 className="mt-6 font-display text-3xl text-iua-navy">{modeTitle}</h2>
          <p className="mt-2 text-sm text-iua-muted">
            {forgotMode && forgotSent ? t("forgotSent") : modeLead}
          </p>

          {!mfaToken && !enrollSecret && !forgotMode && presets.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Demo">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setEmail(p.email);
                    setPassword(p.password);
                    setError(null);
                  }}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                    email === p.email
                      ? "bg-iua-navy text-white"
                      : "bg-white text-iua-navy ring-1 ring-iua-navy/10 hover:bg-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-soft" noValidate>
            {enrollSecret && (
              <div className="rounded-md bg-iua-mist px-3 py-2 text-xs text-iua-navy break-all">
                <p className="font-semibold">{t("mfaSecret")}</p>
                <p className="mt-1 font-mono tracking-wide">{enrollSecret}</p>
              </div>
            )}

            {mfaToken || enrollSecret ? (
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-iua-navy">{t("totp")}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  aria-describedby={error ? errorId : undefined}
                  className="w-full rounded-md border border-iua-navy/15 px-3 py-2.5 tracking-[0.3em] outline-none ring-iua-cyan transition focus:ring-2"
                  placeholder="••••••"
                />
              </label>
            ) : (
              <>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-iua-navy">{t("email")}</span>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-describedby={error ? errorId : undefined}
                    className="w-full rounded-md border border-iua-navy/15 px-3 py-2.5 outline-none ring-iua-cyan transition focus:ring-2"
                  />
                </label>
                {!forgotMode && (
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-iua-navy">{t("password")}</span>
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-describedby={error ? errorId : undefined}
                      className="w-full rounded-md border border-iua-navy/15 px-3 py-2.5 outline-none ring-iua-cyan transition focus:ring-2"
                    />
                  </label>
                )}
              </>
            )}
            {error && (
              <p id={errorId} className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || (forgotMode && forgotSent)}
              className="btn-shine w-full rounded-md bg-iua-navy py-3 text-sm font-semibold text-white transition hover:bg-iua-blue disabled:opacity-60"
            >
              {loading
                ? "…"
                : enrollSecret
                  ? t("mfaConfirm")
                  : mfaToken
                    ? t("submitMfa")
                    : forgotMode
                      ? t("forgotSubmit")
                      : t("submit")}
            </button>
            {(mfaToken || enrollSecret) && (
              <button
                type="button"
                className="w-full text-sm text-iua-muted hover:text-iua-navy"
                onClick={() => {
                  setMfaToken(null);
                  setEnrollToken(null);
                  setEnrollSecret(null);
                  setMfaCode("");
                  setError(null);
                }}
              >
                ← {tc("back")}
              </button>
            )}
            {!mfaToken && !enrollSecret && (
              <button
                type="button"
                className="w-full text-sm text-iua-muted hover:text-iua-navy"
                onClick={() => {
                  setForgotMode((v) => !v);
                  setForgotSent(false);
                  setError(null);
                }}
              >
                {forgotMode ? t("title") : t("forgot")}
              </button>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
