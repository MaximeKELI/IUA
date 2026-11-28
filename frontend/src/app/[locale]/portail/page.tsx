"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { getStoredUser, resolveHomePath } from "@/lib/auth";

export default function PortalIndexPage() {
  const t = useTranslations("common");
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/connexion");
      return;
    }
    router.replace(resolveHomePath(user.roles));
  }, [router]);
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-iua-mist text-iua-navy">
      {t("openingSpace")}
    </main>
  );
}
