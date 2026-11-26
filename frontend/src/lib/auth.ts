"use client";

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  roles: string[];
  mfa_enabled: boolean;
};

const ACCESS_KEY = "iua_access";
const REFRESH_KEY = "iua_refresh";
const USER_KEY = "iua_user";

export function saveSession(access: string, refresh: string, user: AuthUser) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateAccessToken(access: string, refresh?: string) {
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
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
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

export function resolveHomePath(roles: string[]): string {
  if (roles.includes("direction") || roles.includes("super_admin") || roles.includes("finance_dir")) {
    return "/portail/direction";
  }
  if (
    roles.includes("admin") ||
    roles.includes("academic_dir") ||
    roles.includes("secretariat") ||
    roles.includes("faculty_head") ||
    roles.includes("dept_head") ||
    roles.includes("hr") ||
    roles.includes("it")
  ) {
    return "/portail/admin";
  }
  if (roles.includes("teacher")) return "/portail/enseignant";
  if (roles.includes("student") || roles.includes("alumni")) return "/portail/etudiant";
  return "/connexion";
}
