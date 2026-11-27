import {
  type AuthUser,
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
} from "./auth";

export type { AuthUser };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

export type LoginResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};

export type Page<T> = {
  count?: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Role = {
  id: string;
  code: string;
  name: string;
  description: string;
};

export type ManagedUser = AuthUser & {
  phone?: string;
  is_active: boolean;
  date_joined?: string;
};

const DEFAULT_TIMEOUT_MS = 12_000;

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") {
      if (data.details && typeof data.details === "object") {
        const parts = Object.entries(data.details as Record<string, unknown>).map(([k, v]) => {
          const val = Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : JSON.stringify(v);
          return `${k}: ${val}`;
        });
        if (parts.length) return `${data.message} (${parts.join(" · ")})`;
      }
      return data.message;
    }
    if (typeof data?.detail === "string") return data.detail;
    if (data?.details) return JSON.stringify(data.details);
    return JSON.stringify(data);
  } catch {
    /* ignore */
  }
  if (res.status === 401) return "Session expirée. Reconnectez-vous.";
  if (res.status === 403) return "Accès refusé pour votre rôle.";
  return `Erreur HTTP ${res.status}`;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    try {
      const res = await fetchWithTimeout(`${API_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh }),
        cache: "no-store",
      });
      if (!res.ok) {
        clearSession();
        return null;
      }
      const data = (await res.json()) as { access: string; refresh?: string };
      updateAccessToken(data.access, data.refresh);
      return data.access;
    } catch {
      clearSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (!window.location.pathname.startsWith("/connexion")) {
    window.location.href = "/connexion";
  }
}

async function authorizedFetch(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<Response> {
  let access = token ?? getAccessToken();
  if (!access) {
    redirectToLogin();
    throw new Error("Session absente. Reconnectez-vous.");
  }

  const doFetch = (tok: string) =>
    fetchWithTimeout(`${API_URL}${path}`, {
      ...init,
      headers: { ...authHeaders(tok), ...(init.headers || {}) },
      cache: "no-store",
    });

  let res = await doFetch(access);
  if (res.status === 401) {
    const next = await refreshAccessToken();
    if (!next) {
      redirectToLogin();
      throw new Error("Session expirée. Reconnectez-vous.");
    }
    res = await doFetch(next);
    if (res.status === 401) {
      clearSession();
      redirectToLogin();
      throw new Error("Session expirée. Reconnectez-vous.");
    }
  }
  return res;
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetchWithTimeout(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiLogout(): Promise<void> {
  const refresh = getRefreshToken();
  const access = getAccessToken();
  if (access && refresh) {
    try {
      await fetchWithTimeout(`${API_URL}/auth/logout/`, {
        method: "POST",
        headers: authHeaders(access),
        body: JSON.stringify({ refresh }),
        cache: "no-store",
      });
    } catch {
      /* ignore network errors on logout */
    }
  }
  clearSession();
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const res = await authorizedFetch(path, { method: "GET" }, token);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiSend<T>(
  path: string,
  token: string | null | undefined,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await authorizedFetch(
    path,
    {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    token,
  );
  if (!res.ok) throw new Error(await parseError(res));
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

const memoryCache = new Map<string, { expires: number; data: unknown }>();

export async function apiGetCached<T>(
  path: string,
  token?: string | null,
  ttlMs = 15_000,
): Promise<T> {
  const key = `${(token || getAccessToken() || "").slice(0, 12)}:${path}`;
  const hit = memoryCache.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.data as T;
  }
  const data = await apiGet<T>(path, token);
  memoryCache.set(key, { expires: Date.now() + ttlMs, data });
  return data;
}

export function clearApiMemoryCache() {
  memoryCache.clear();
}

export function unwrapList<T>(data: Page<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results || [];
}

export { API_URL };
