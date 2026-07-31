import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "@/styles/rovexo/index.css";
import "./globals.css";
import { SearchProvider } from "@/features/search/client";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { AvatarProvider } from "@/features/auth/providers/AvatarProvider";
import { HeaderProvider } from "@/features/header/HeaderProvider";
import { AppShellLayout } from "@/components/layout/AppShellLayout";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { VisitorPresenceBeacon } from "@/components/analytics/VisitorPresenceBeacon";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { PageVisibilityProvider } from "@/components/providers/PageVisibilityProvider";
import { LocaleProvider } from "@/lib/i18n/provider";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { PushSubscriptionManager } from "@/features/notifications/components/PushSubscriptionManager";
import { ToastProvider } from "@/components/ui/Toast";
import { organizationJsonLd } from "@/lib/seo/metadata";
import { getAppUrl } from "@/lib/supabase/env";
import { resolveLaunchPrivateModeRobots } from "@/lib/launch-certification/private-mode";

const launchPrivateRobots = resolveLaunchPrivateModeRobots();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pre-paint locale sync: applies the stored locale to <html lang/dir> before
// hydration so language and text direction (incl. RTL) never flash on first paint.
const LOCALE_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem("rovexo-locale");if(!c||!/^[a-z]{2}-[A-Z]{2}$/.test(c))return;var el=document.documentElement;el.setAttribute("lang",c);el.setAttribute("dir",c==="ar-SA"?"rtl":"ltr");}catch(e){}})();`;

/** Single root viewport SSOT — do not duplicate conflicting viewport tags. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "ROVEXO – Buy & Sell on the Modern Marketplace",
    template: "%s | ROVEXO",
  },
  description: "Discover pre-loved treasures and trusted retail deals on ROVEXO.",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "ROVEXO",
    title: "ROVEXO – Buy & Sell on the Modern Marketplace",
    description: "Discover pre-loved treasures and trusted retail deals on ROVEXO.",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630, alt: "ROVEXO" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ROVEXO – Buy & Sell on the Modern Marketplace",
    description: "Discover pre-loved treasures and trusted retail deals on ROVEXO.",
    images: ["/brand/og-image.png"],
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
    icon: [
      { url: "/brand/canonical-rx/app-icon-v1.png", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  ...(launchPrivateRobots ? { robots: launchPrivateRobots } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      dir="ltr"
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_INIT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        <PageVisibilityProvider>
          <LocaleProvider>
            <PwaProvider>
              <PushSubscriptionManager />
              <ToastProvider>
                <AuthProvider>
                  <AvatarProvider>
                    <SearchProvider>
                      <HeaderProvider>
                        <AppShellLayout>{children}</AppShellLayout>
                      </HeaderProvider>
                    </SearchProvider>
                  </AvatarProvider>
                </AuthProvider>
              </ToastProvider>
            </PwaProvider>
          </LocaleProvider>
        </PageVisibilityProvider>
        <GoogleAnalytics />
        <CookieConsentBanner />
        <VisitorPresenceBeacon />
      </body>
    </html>
  );
}
