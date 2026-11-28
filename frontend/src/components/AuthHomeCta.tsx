"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getAccessToken, getStoredUser, resolveHomePath } from "@/lib/auth";

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

  useEffect(() => {
    if (!getAccessToken()) return;
    const user = getStoredUser();
    if (!user) return;
    setHref(resolveHomePath(user.roles));
    setLabel(t("mySpace"));
  }, [t]);

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
