import type { Metadata } from "next";
import { AuthRouteLayout } from "@/components/auth/AuthRouteLayout";

/** RC6 — auth-route CSS only (not full platform index.css). */
import "@/styles/rovexo/auth-entry.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthRouteLayout>{children}</AuthRouteLayout>;
}
