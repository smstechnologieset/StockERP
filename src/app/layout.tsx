import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Suspense } from "react";
import { ProgressBar } from "@/components/navigation/ProgressBar";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stock & Inventory ERP | Shop Management",
  description: "Point of sale, stock tracking, credit management, and inventory ledger for shop and retail operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <LanguageProvider>
          <Suspense fallback={null}>
            <ProgressBar />
          </Suspense>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
