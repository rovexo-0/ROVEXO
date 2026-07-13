import type { Metadata, Viewport } from "next";
import { redirectIfAuthenticated } from "@/lib/auth/guest-redirect";
import { WelcomeScreen } from "@/features/auth/components/WelcomeScreen";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function WelcomePage() {
  await redirectIfAuthenticated();

  return <WelcomeScreen />;
}
