import type { Metadata } from "next";
import localFont from "next/font/local";
import { sidebarPreferenceScript } from "@/lib/sidebar-preference";
import "./globals.css";

const interTight = localFont({ src: "../assets/fonts/InterTight-Variable.ttf", variable: "--font-inter-tight", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Servify", template: "%s | Servify" },
  description: "Find the right person. Get it done. An Ibadan-first local services marketplace.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG" suppressHydrationWarning>
      <head><script id="sidebar-preference" dangerouslySetInnerHTML={{ __html: sidebarPreferenceScript }}/></head>
      <body className={interTight.variable}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
