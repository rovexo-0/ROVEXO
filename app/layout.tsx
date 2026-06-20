import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { SearchProvider } from "@/features/search/client";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://rovexo.com"),
  title: {
    default: "ROVEXO – Buy & Sell on the Modern Marketplace",
    template: "%s | ROVEXO",
  },
  description:
    "Discover pre-loved treasures and trusted retail deals on ROVEXO.",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "ROVEXO",
    title: "ROVEXO – Buy & Sell on the Modern Marketplace",
    description:
      "Discover pre-loved treasures and trusted retail deals on ROVEXO.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ROVEXO – Buy & Sell on the Modern Marketplace",
    description:
      "Discover pre-loved treasures and trusted retail deals on ROVEXO.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        <ThemeProvider>
          <SearchProvider>
            {children}
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
