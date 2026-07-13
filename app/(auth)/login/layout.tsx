import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function LoginRouteLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-login-route">{children}</div>;
}
