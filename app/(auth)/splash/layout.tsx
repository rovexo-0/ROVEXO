import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ROVEXO",
  robots: { index: false, follow: false },
};

/** Match splash stage before CSS bundle paints — prevents white flash. */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function SplashRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="auth-splash-route"
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(180deg, #ffffff 0%, #fafafa 48%, #ffffff 100%)",
      }}
    >
      {children}
    </div>
  );
}
