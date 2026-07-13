import type { Metadata } from "next";
import { AuthRouteLayout } from "@/components/auth/AuthRouteLayout";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthRouteLayout>{children}</AuthRouteLayout>;
}
