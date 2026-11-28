import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const apiProxyTarget = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8001").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  // Keep Django trailing-slash URLs intact for the /api/v1 proxy route.
  skipTrailingSlashRedirect: true,
  // LAN hosts for Next 15 dev — without the LAN IP, /_next/* is blocked and
  // client hydration never runs (page stuck on "Vérification de votre session…").
  allowedDevOrigins: (
    process.env.ALLOWED_DEV_ORIGINS || "127.0.0.1,localhost,192.168.1.64"
  )
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean),
  async rewrites() {
    return [
      {
        // Always hit authenticated media endpoint — never public Django /media/
        source: "/media/:path*",
        destination: `${apiProxyTarget}/api/v1/media/:path*`,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [55, 60, 65, 75, 85, 90],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // CDN-ready remote patterns (production can point brand assets to a CDN host)
    remotePatterns: [
      { protocol: "https", hostname: "cdn.iuaci.org" },
      { protocol: "https", hostname: "images.iuaci.org" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  headers: async () => {
    const isProd = process.env.NODE_ENV === "production";
    // Next.js still needs 'unsafe-inline' for some bootstrap; drop 'unsafe-eval' in prod.
    const scriptSrc = isProd
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' http://127.0.0.1:* http://localhost:* https:",
      "frame-src 'self' https://meet.jit.si https://*.jit.si",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Content-Security-Policy", value: csp },
      ...(isProd
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains; preload",
            },
          ]
        : []),
    ];
    // Never immutable-cache /_next/static in development — chunk paths are stable
    // (no content hash), so the browser kept serving a broken UserAvatar/PortalShell
    // and the portal looked blank/white after code changes.
    const staticCache =
      process.env.NODE_ENV === "production"
        ? [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
        : [{ key: "Cache-Control", value: "no-store, must-revalidate" }];
    return [
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/_next/static/:path*",
        headers: staticCache,
      },
      {
        source: "/(.*)",
        headers: security,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
