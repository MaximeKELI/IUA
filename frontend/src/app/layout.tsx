import type { Metadata } from "next";
import { Libre_Baskerville, Manrope } from "next/font/google";
import "./globals.css";

const display = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "IUA Digital Campus",
    template: "%s · IUA Digital Campus",
  },
  description:
    "Portail numérique de l'Institut Universitaire d'Abidjan — études, services et administration en un seul écosystème.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
