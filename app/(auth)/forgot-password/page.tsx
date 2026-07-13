import type { Metadata, Viewport } from "next";
import { redirectIfAuthenticated } from "@/lib/auth/guest-redirect";
import { ForgotPasswordScreen } from "@/features/auth/components/ForgotPasswordScreen";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function ForgotPasswordPage() {
  await redirectIfAuthenticated();
  return <ForgotPasswordScreen />;
}
