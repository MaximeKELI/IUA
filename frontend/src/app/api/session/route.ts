import { NextRequest, NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

function cookieOpts(maxAge: number, httpOnly = true) {
  return {
    httpOnly,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Mirror JWT + roles into cookies for Edge middleware portal gating.
 * Roles cookie is HttpOnly — only middleware/server reads it (not forgeable from JS).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  const access = body.access && body.access !== "cookie" ? String(body.access) : null;
  const refresh = body.refresh && body.refresh !== "cookie" ? String(body.refresh) : null;
  if (access && refresh) {
    res.cookies.set("iua_access", access, cookieOpts(60 * 15));
    res.cookies.set("iua_refresh", refresh, cookieOpts(60 * 60 * 24 * 3));
  }
  if (body.roles) {
    res.cookies.set("iua_roles", JSON.stringify(body.roles), cookieOpts(60 * 60 * 24 * 3, true));
  }
  if (!access && !refresh && !body.roles) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  for (const name of ["iua_access", "iua_refresh", "iua_roles"]) {
    res.cookies.set(name, "", { httpOnly: true, path: "/", maxAge: 0 });
  }
  return res;
}
