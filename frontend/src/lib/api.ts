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

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export { API_URL };
