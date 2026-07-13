import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ROVEXO",
  robots: { index: false, follow: false },
};

/** Match splash gradient before CSS bundle paints — prevents white flash. */
export const viewport: Viewport = {
  themeColor: "#f5f0ff",
};

export default function SplashRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="auth-splash-route"
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(180deg, #f5f0ff 0%, #faf8ff 42%, #ffffff 100%)",
      }}
    >
      {children}
    </div>
  );
}
