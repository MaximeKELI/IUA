"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, resolveHomePath } from "@/lib/auth";

export default function PortalIndexPage() {
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/connexion");
      return;
    }
    router.replace(resolveHomePath(user.roles));
  }, [router]);
  return null;
}
