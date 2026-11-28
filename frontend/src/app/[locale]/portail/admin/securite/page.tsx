"use client";

import { useTranslations } from "next-intl";

import { FormEvent, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiSend } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { resolveOpsNav, resolveOpsTitle } from "@/lib/portalCapabilities";
import { useAuthToken } from "@/lib/useAuthToken";

type Setup = { secret: string; otpauth_uri: string };

export default function AdminSecuritePage() {
  const tPortal = useTranslations("portal");

  const { token, ready } = useAuthToken();
  const roles = getStoredUser()?.roles || [];
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startSetup() {
    if (!ready || !token) return;
    setBusy(true);
    setError(null);
    try {
      const data = await apiSend<Setup>("/auth/mfa/setup/", token, "POST", {});
      setSetup(data);
      setOk("Secret généré — scannez-le puis confirmez avec un code.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setBusy(false);
    }
  }

  async function enable(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiSend("/auth/mfa/enable/", token, "POST", { code });
      setOk("MFA activé. Lors des prochaines connexions, un code TOTP sera demandé.");
      setSetup(null);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalShell title={resolveOpsTitle(roles)} nav={resolveOpsNav(roles)}>
      <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Sécurité</p>
      <h1 className="mt-2 font-display text-3xl text-iua-navy">{tPortal("pages.admin.securite")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-iua-muted">
        Recommandé pour admin, direction et finance. Utilisez Google Authenticator, Authy ou
        équivalent.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <div className="mt-8 rounded-xl bg-white p-6 shadow-soft">
        {!setup ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void startSetup()}
            className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "…" : "Générer un secret MFA"}
          </button>
        ) : (
          <form onSubmit={enable} className="space-y-4">
            <p className="text-sm text-iua-navy">
              Secret : <code className="rounded bg-iua-mist px-2 py-1 text-xs">{setup.secret}</code>
            </p>
            <p className="break-all text-xs text-iua-muted">{setup.otpauth_uri}</p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Code de confirmation</span>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="w-40 rounded-md border border-iua-navy/15 px-3 py-2 tracking-widest"
              />
            </label>
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Activer MFA
            </button>
          </form>
        )}
      </div>
    </PortalShell>
  );
}
