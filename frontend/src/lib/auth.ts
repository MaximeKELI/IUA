"use client";

import type { AuthUser } from "./api";

const ACCESS_KEY = "iua_access";
const REFRESH_KEY = "iua_refresh";
const USER_KEY = "iua_user";

export function saveSession(access: string, refresh: string, user: AuthUser) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
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

export function resolveHomePath(roles: string[]): string {
  if (roles.includes("direction") || roles.includes("super_admin")) return "/portail/direction";
  if (roles.includes("admin") || roles.includes("academic_dir")) return "/portail/admin";
  if (roles.includes("teacher")) return "/portail/enseignant";
  if (roles.includes("student")) return "/portail/etudiant";
  return "/portail";
}
