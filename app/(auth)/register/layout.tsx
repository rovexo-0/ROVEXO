import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RegisterRouteLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-register-route">{children}</div>;
}
