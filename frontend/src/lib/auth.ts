"use client";

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  roles: string[];
  /** Permission codes from RBAC (e.g. services.request.manage). */
  permissions?: string[];
  mfa_enabled: boolean;
  avatar_url?: string | null;
  phone?: string;
};

/** Initials from first + last name (e.g. Kofi Traoré → KT). */
export function userInitials(user: Pick<AuthUser, "first_name" | "last_name" | "full_name" | "email">): string {
  const first = (user.first_name || "").trim();
  const last = (user.last_name || "").trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?";
  }
  const parts = (user.full_name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return (user.email || "?").charAt(0).toUpperCase();
}

/** Prefer same-origin /media path when Django returns absolute localhost URL. */
export function resolveAvatarSrc(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;
  try {
    if (avatarUrl.startsWith("/")) return avatarUrl;
    const u = new URL(avatarUrl);
    if (u.pathname.startsWith("/media/")) return u.pathname + u.search;
    return avatarUrl;
  } catch {
    return avatarUrl;
  }
}

const ACCESS_KEY = "iua_access";
const REFRESH_KEY = "iua_refresh";
const USER_KEY = "iua_user";

/** Opt-in: no JWTs in localStorage (HttpOnly cookies + credentials:include). */
export function isCookieOnlyAuth(): boolean {
  return process.env.NEXT_PUBLIC_COOKIE_ONLY_AUTH === "true";
}

export function saveSession(access: string, refresh: string, user: AuthUser) {
  if (isCookieOnlyAuth()) {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } else {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    else localStorage.removeItem(ACCESS_KEY);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    else localStorage.removeItem(REFRESH_KEY);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateAccessToken(access: string, refresh?: string) {
  if (isCookieOnlyAuth()) return;
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  if (isCookieOnlyAuth()) {
    // Sentinel: API layer uses credentials:include; Authorization omitted.
    return getStoredUser() ? "cookie" : null;
  }
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  if (isCookieOnlyAuth()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export { resolveHomePath } from "./authPaths";
