"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken, getStoredUser, resolveHomePath } from "@/lib/auth";

export function AuthHomeCta({
  className,
  guestHref = "/connexion",
  guestLabel = "Me connecter",
  memberLabel = "Mon espace",
}: {
  className?: string;
  guestHref?: string;
  guestLabel?: string;
  memberLabel?: string;
}) {
  const [href, setHref] = useState(guestHref);
  const [label, setLabel] = useState(guestLabel);

  useEffect(() => {
    if (!getAccessToken()) return;
    const user = getStoredUser();
    if (!user) return;
    setHref(resolveHomePath(user.roles));
    setLabel(memberLabel);
  }, [memberLabel]);

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
