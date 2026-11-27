import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/libre-baskerville/400.css";
import "@fontsource/libre-baskerville/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IUA Digital Campus",
    template: "%s · IUA Digital Campus",
  },
  description:
    "Portail de l'Institut Universitaire d'Abidjan : études, services et administration.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A2342",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preload" href="/brand/campus-hero.png" as="image" type="image/png" />
        <link rel="preload" href="/brand/logo-iua-white-v2.svg" as="image" type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
