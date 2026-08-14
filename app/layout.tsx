import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

/**
 * RC6/RC7 — design-system CSS is route-split:
 * - Auth: `styles/rovexo/auth-entry.css` via `app/(auth)/layout.tsx`
 * - Platform: `styles/rovexo/index.css` via `app/(platform)/layout.tsx`
 * Root keeps globals + auth/session providers only (login LCP isolation).
 * Search/Header mount under `app/(platform)` via PlatformChromeProviders.
 */
import "./globals.css";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { AvatarProvider } from "@/features/auth/providers/AvatarProvider";
import { AppShellLayout } from "@/components/layout/AppShellLayout";
import { PageVisibilityProvider } from "@/components/providers/PageVisibilityProvider";
import { LocaleProvider } from "@/lib/i18n/provider";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { organizationJsonLd } from "@/lib/seo/metadata";
import { getAppUrl } from "@/lib/supabase/env";
import { resolveLaunchPrivateModeRobots } from "@/lib/launch-certification/private-mode";
import { AuthChromeDeferred } from "@/components/layout/AuthChromeDeferred";
import { ChunkLoadRecovery } from "@/components/runtime/ChunkLoadRecovery";
import { CHUNK_LOAD_BOOTSTRAP_SCRIPT } from "@/components/runtime/chunk-load-bootstrap";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { withWhitePearlFaviconCacheBust } from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";
import { RovexoThemeProvider } from "@/components/providers/RovexoThemeProvider";

const launchPrivateRobots = resolveLaunchPrivateModeRobots();
const faviconV = withWhitePearlFaviconCacheBust;

function resolveSupabaseOrigin(): string | null {
  const configured =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  if (!configured) return "https://pklotmwxtnnepaitedic.supabase.co";
  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

const supabaseOrigin = resolveSupabaseOrigin();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  /* P1 CWV: size-adjusted fallbacks reduce font-swap CLS on mobile. */
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  /* Mono is rare (e.g. shipping barcode) — do not compete with LCP sans preload. */
  preload: false,
  adjustFontFallback: true,
});

/**
 * COD SÂNGE hydration (#418): do NOT mutate <html lang/dir/data-theme> before
 * React hydrates. SSR + first client render stay deterministic (en-GB / ltr / light).
 * LocaleProvider + RovexoThemeProvider apply stored preferences after mount.
 */

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
  // P0-02: no root canonical — pages set absolute canonical via buildPageMetadata /
  // route metadata. A global "/" canonical was inherited by soft-unavailable pages.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ROVEXO",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: faviconV("/favicon.ico") },
      { url: faviconV("/favicon.svg"), type: "image/svg+xml" },
      { url: faviconV("/icons/favicon-16.png"), sizes: "16x16", type: "image/png" },
      { url: faviconV("/icons/favicon-32.png"), sizes: "32x32", type: "image/png" },
      { url: faviconV("/icons/icon-32.png"), sizes: "32x32", type: "image/png" },
      { url: faviconV("/icons/favicon-48.png"), sizes: "48x48", type: "image/png" },
      { url: faviconV("/icons/icon-48.png"), sizes: "48x48", type: "image/png" },
      { url: faviconV("/icons/favicon-64.png"), sizes: "64x64", type: "image/png" },
      { url: faviconV("/icons/icon-64.png"), sizes: "64x64", type: "image/png" },
      { url: faviconV("/icons/android-chrome-192x192.png"), sizes: "192x192", type: "image/png" },
      { url: faviconV("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { url: faviconV("/icons/android-chrome-512x512.png"), sizes: "512x512", type: "image/png" },
      { url: faviconV("/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: faviconV("/apple-touch-icon.png"), sizes: "180x180", type: "image/png" },
    ],
    shortcut: [{ url: faviconV("/favicon.ico") }],
    other: [
      {
        rel: "mask-icon",
        url: faviconV("/safari-pinned-tab.svg"),
        color: "#9333ea",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#FFFFFF",
    "msapplication-config": faviconV("/browserconfig.xml"),
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
        {/* P9 — early connection setup for marketplace media (delivery only). */}
        {/* OPT-P0-PERF-05: Stripe js.stripe.com preconnect is route-scoped to
            app/(platform)/wallet/payment-methods/layout.tsx (sole loadStripe owner). */}
        {supabaseOrigin ? <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" /> : null}
      </head>
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        {/* Chunk recovery only — never mutate <html> attributes before hydration. */}
        <Script id="rovexo-chunk-load-bootstrap" strategy="beforeInteractive">
          {CHUNK_LOAD_BOOTSTRAP_SCRIPT}
        </Script>
        <JsonLdScript id="rovexo-organization-jsonld" data={organizationJsonLd()} />
        <PageVisibilityProvider>
          <LocaleProvider>
            <RovexoThemeProvider>
              <PwaProvider>
                <ToastProvider>
                  <AuthProvider>
                    <AvatarProvider>
                      <AppShellLayout>{children}</AppShellLayout>
                    </AvatarProvider>
                  </AuthProvider>
                </ToastProvider>
              </PwaProvider>
            </RovexoThemeProvider>
          </LocaleProvider>
        </PageVisibilityProvider>
        <AuthChromeDeferred mode="platform-chrome" />
        <ChunkLoadRecovery />
      </body>
    </html>
  );
}
