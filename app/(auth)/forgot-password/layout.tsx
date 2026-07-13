import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function ForgotPasswordRouteLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-forgot-password-route">{children}</div>;
}
