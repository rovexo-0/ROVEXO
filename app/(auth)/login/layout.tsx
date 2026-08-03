import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function LoginRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-login-route">
      {/* LCP preload — same Level II Primary Emblem artwork (AVIF), appearance unchanged */}
      <link
        rel="preload"
        as="image"
        href="/brand/canonical-rx/primary-emblem-auth-v4.avif"
        type="image/avif"
        fetchPriority="high"
      />
      {children}
    </div>
  );
}
