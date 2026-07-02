import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { AmbientBackground } from "@/components/AmbientBackground";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Analizador de Fútbol | Value Betting",
  description:
    "Plataforma de análisis predictivo y detección de valor en apuestas deportivas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
      <body className="relative min-h-screen bg-[#060a12] font-sans text-slate-100 antialiased">
        <AmbientBackground />
        <div className="relative z-0">{children}</div>
      </body>
    </html>
  );
}
