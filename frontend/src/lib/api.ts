const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  roles: string[];
  mfa_enabled: boolean;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};

export type CursorPage<T> = {
  next: string | null;
  previous: string | null;
  results: T[];
};

const DEFAULT_TIMEOUT_MS = 12_000;

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;
    if (data?.details) return JSON.stringify(data.details);
  } catch {
    /* ignore */
  }
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

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetchWithTimeout(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiGet<T>(
  path: string,
  token: string,
  options?: { cacheSeconds?: number },
): Promise<T> {
  const cacheSeconds = options?.cacheSeconds;
  const res = await fetchWithTimeout(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: cacheSeconds ? "force-cache" : "no-store",
    next: cacheSeconds ? { revalidate: cacheSeconds } : undefined,
  } as RequestInit);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

/** Client-side in-memory cache for dashboards (short TTL). */
const memoryCache = new Map<string, { expires: number; data: unknown }>();

export async function apiGetCached<T>(
  path: string,
  token: string,
  ttlMs = 15_000,
): Promise<T> {
  const key = `${token.slice(0, 12)}:${path}`;
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

export { API_URL };
