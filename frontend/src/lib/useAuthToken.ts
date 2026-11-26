"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";

/** Read JWT only after mount to avoid SSR null + empty-deps load bugs. */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(getAccessToken());
    setReady(true);
  }, []);

  return { token, ready };
}
