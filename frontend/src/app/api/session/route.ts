import { NextRequest, NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Mirror JWT into HttpOnly cookies for middleware portal gating. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.access || !body?.refresh) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("iua_access", String(body.access), cookieOpts(60 * 30));
  res.cookies.set("iua_refresh", String(body.refresh), cookieOpts(60 * 60 * 24 * 7));
  if (body.roles) {
    res.cookies.set("iua_roles", JSON.stringify(body.roles), {
      ...cookieOpts(60 * 60 * 24 * 7),
      httpOnly: false, // readable by client role checks if needed; middleware can read too
    });
  }
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  for (const name of ["iua_access", "iua_refresh", "iua_roles"]) {
    res.cookies.set(name, "", { httpOnly: name !== "iua_roles", path: "/", maxAge: 0 });
  }
  return res;
}
