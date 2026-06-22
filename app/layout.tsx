import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { SearchProvider } from "@/features/search/client";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { organizationJsonLd } from "@/lib/seo/metadata";

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
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "ROVEXO" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ROVEXO – Buy & Sell on the Modern Marketplace",
    description:
      "Discover pre-loved treasures and trusted retail deals on ROVEXO.",
    images: ["/icons/icon-512.png"],
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ROVEXO",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
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
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-text-primary"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <ThemeProvider>
          <PwaProvider>
            <SearchProvider>
              {children}
            </SearchProvider>
          </PwaProvider>
        </ThemeProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
