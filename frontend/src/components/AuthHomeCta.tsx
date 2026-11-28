"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getAccessToken, getStoredUser, resolveHomePath } from "@/lib/auth";

/** Primary hero CTA: register for guests, "Mon espace" when logged in. */
export function AuthApplyCta({
  className,
  guestHref = "/admissions",
}: {
  className?: string;
  guestHref?: string;
}) {
  const t = useTranslations("common");
  const th = useTranslations("home");
  const [href, setHref] = useState(guestHref);
  const [label, setLabel] = useState(th("ctaApply"));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      const user = getStoredUser();
      if (user) {
        setHref(resolveHomePath(user.roles));
        setLabel(t("mySpace"));
      }
    }
    setReady(true);
  }, [t, th]);

  if (!ready) {
    return (
      <span className={`${className} opacity-70`} aria-hidden>
        {th("ctaApply")}
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

/** Secondary hero CTA: login for guests, hidden/replaced when logged in. */
export function AuthHomeCta({
  className,
  guestHref = "/connexion",
}: {
  className?: string;
  guestHref?: string;
}) {
  const t = useTranslations("common");
  const th = useTranslations("home");
  const [href, setHref] = useState(guestHref);
  const [label, setLabel] = useState(th("ctaLogin"));
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      const user = getStoredUser();
      if (user) {
        setHref(resolveHomePath(user.roles));
        setLabel(t("mySpace"));
        setLoggedIn(true);
      }
    }
    setReady(true);
  }, [t]);

  if (!ready) return null;
  // When logged in, primary AuthApplyCta already points to the space — skip duplicate.
  if (loggedIn) return null;

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
