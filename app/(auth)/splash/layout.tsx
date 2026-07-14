import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ROVEXO",
  robots: { index: false, follow: false },
};

/** Theme + status bar match splash paint — never black / bare white gap. */
export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "only light",
};

/**
 * SSR splash chrome paints before client JS — eliminates blank PWA startup.
 * Client SplashScreen overlays the same stage and runs session bootstrap.
 */
export default function SplashRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="auth-splash-route"
      style={{
        minHeight: "100dvh",
        width: "100%",
        backgroundColor: "#ffffff",
        colorScheme: "light",
      }}
    >
      <div className="auth-splash auth-splash--ssr" aria-hidden="true">
        <div className="auth-splash__stage">
          {/* eslint-disable-next-line @next/next/no-img-element -- first-paint SSR; SafeImage/next/image not for splash SSOT */}
          <img
            className="auth-splash__mark"
            src="/icons/icon-192.png"
            width={96}
            height={96}
            alt=""
            decoding="async"
          />
          <p className="auth-splash__wordmark">
            ROV<span className="auth-splash__wordmark-x">X</span>O
          </p>
          <p className="auth-splash__tagline">Buy. Sell. Grow.</p>
          <div className="auth-splash__indicator">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
