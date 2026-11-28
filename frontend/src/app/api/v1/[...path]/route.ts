import { NextRequest, NextResponse } from "next/server";

const TARGET = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8001").replace(/\/$/, "");

async function proxy(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const joined = path.filter(Boolean).join("/");
  // Django APPEND_SLASH expects a trailing slash on API routes.
  const targetUrl = `${TARGET}/api/v1/${joined}/${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "connection" || lower === "content-length") return;
    headers.set(key, value);
  });
  headers.set("accept", req.headers.get("accept") || "application/json");

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (err) {
    return NextResponse.json(
      {
        code: "api_unreachable",
        message:
          err instanceof Error
            ? `API injoignable (${err.message}). Vérifiez que Django tourne sur ${TARGET}.`
            : `API injoignable sur ${TARGET}.`,
      },
      { status: 502 },
    );
  }

  const outHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (["transfer-encoding", "connection", "content-encoding"].includes(lower)) return;
    outHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
