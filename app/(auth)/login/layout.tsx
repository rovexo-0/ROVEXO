import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

/**
 * P10.5 — no `<link rel="preload">` here.
 * Primary Emblem LCP is owned by `RovexoBrandLogo` (`fetchPriority="high"` on the
 * same AVIF). A layout preload was hoisted across routes and triggered
 * “preloaded but not used” on non-auth pages (and was redundant on /login).
 */
export default function LoginRouteLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-login-route">{children}</div>;
}
