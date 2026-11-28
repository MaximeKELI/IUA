import {
  type AuthUser,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  updateAccessToken,
} from "./auth";

export type { AuthUser };

/** Prefer relative `/api/v1` (Next rewrite) so LAN / localhost both work. */
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/$/, "");

export type LoginResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};

export type LoginResult =
  | LoginResponse
  | {
      mfa_required: true;
      mfa_token: string;
      message?: string;
    }
  | {
      mfa_enrollment_required: true;
      message?: string;
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
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      credentials: "include",
    });
  } finally {
    clearTimeout(timer);
  }
}

function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )iua_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const csrf = readCsrfCookie();
  if (csrf) headers["X-IUA-CSRF"] = csrf;
  return headers;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    try {
      const res = await fetchWithTimeout(`${API_URL}/auth/refresh/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(refresh ? { refresh } : {}),
        cache: "no-store",
      });
      if (!res.ok) {
        clearSession();
        void clearSessionCookies();
        return null;
      }
      const data = (await res.json()) as { access?: string; refresh?: string };
      if (data.access) {
        updateAccessToken(data.access, data.refresh);
        void syncSessionCookies(data.access, data.refresh || refresh || data.access, getStoredUser()?.roles);
        return data.access;
      }
      // Cookie-only refresh: cookies updated via Set-Cookie; keep opaque marker
      return getAccessToken() || "cookie";
    } catch {
      clearSession();
      void clearSessionCookies();
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
  const hasUser = !!getStoredUser();
  // Cookie auth may work without localStorage token
  if (!access && !hasUser) {
    redirectToLogin();
    throw new Error("Session absente. Reconnectez-vous.");
  }

  const doFetch = (tok: string | null) =>
    fetchWithTimeout(`${API_URL}${path}`, {
      ...init,
      headers: { ...authHeaders(tok && tok !== "cookie" ? tok : null), ...(init.headers || {}) },
      cache: "no-store",
    });

  let res = await doFetch(access);
  if (res.status === 401) {
    const next = await refreshAccessToken();
    if (!next) {
      redirectToLogin();
      throw new Error("Session expirée. Reconnectez-vous.");
    }
    res = await doFetch(next === "cookie" ? null : next);
    if (res.status === 401) {
      clearSession();
      void clearSessionCookies();
      redirectToLogin();
      throw new Error("Session expirée. Reconnectez-vous.");
    }
  }
  return res;
}

export async function syncSessionCookies(
  access: string,
  refresh: string,
  roles?: string[],
): Promise<void> {
  try {
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access, refresh, roles }),
    });
  } catch {
    /* non-fatal for API calls */
  }
}

export async function clearSessionCookies(): Promise<void> {
  try {
    await fetch("/api/session", { method: "DELETE" });
  } catch {
    /* ignore */
  }
}

export async function apiLogin(email: string, password: string): Promise<LoginResult> {
  const res = await fetchWithTimeout(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiMfaVerify(mfaToken: string, code: string): Promise<LoginResponse> {
  const res = await fetchWithTimeout(`${API_URL}/auth/mfa/verify/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mfa_token: mfaToken, code }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiLogout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    await fetchWithTimeout(`${API_URL}/auth/logout/`, {
      method: "POST",
      headers: authHeaders(getAccessToken()),
      body: JSON.stringify(refresh ? { refresh } : {}),
      cache: "no-store",
    });
  } catch {
    /* ignore network errors on logout */
  }
  clearSession();
  await clearSessionCookies();
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

/** Multipart upload (e.g. avatar) — does not force JSON Content-Type. */
export async function apiUpload<T>(
  path: string,
  token: string | null | undefined,
  formData: FormData,
  method: "POST" | "PATCH" | "PUT" = "PATCH",
): Promise<T> {
  const access = token ?? getAccessToken();
  if (!access && !getStoredUser()) {
    redirectToLogin();
    throw new Error("Session absente. Reconnectez-vous.");
  }

  const doFetch = (tok: string | null) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (tok && tok !== "cookie") headers.Authorization = `Bearer ${tok}`;
    const csrf = readCsrfCookie();
    if (csrf) headers["X-IUA-CSRF"] = csrf;
    return fetchWithTimeout(`${API_URL}${path}`, {
      method,
      headers,
      body: formData,
      cache: "no-store",
    });
  };

  let res = await doFetch(access);
  if (res.status === 401) {
    const next = await refreshAccessToken();
    if (!next) {
      redirectToLogin();
      throw new Error("Session expirée. Reconnectez-vous.");
    }
    res = await doFetch(next === "cookie" ? null : next);
  }
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
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
