import type { Metadata } from "next";
import { SplashScreen } from "@/features/auth/components/SplashScreen";

export const metadata: Metadata = {
  title: "ROVEXO",
  robots: { index: false, follow: false },
};

export default function SplashPage() {
  return <SplashScreen />;
}
