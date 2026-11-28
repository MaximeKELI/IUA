"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getAccessToken, getStoredUser, resolveHomePath } from "@/lib/auth";

/** Bottom CTA: admissions for guests, portal for logged-in users. */
export function AuthIntakeCta({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const t = useTranslations("common");
  const [href, setHref] = useState("/admissions");
  const [text, setText] = useState(label);

  useEffect(() => {
    if (!getAccessToken()) return;
    const user = getStoredUser();
    if (!user) return;
    setHref(resolveHomePath(user.roles));
    setText(t("mySpace"));
  }, [t, label]);

  return (
    <Link href={href} className={className}>
      {text}
    </Link>
  );
}
