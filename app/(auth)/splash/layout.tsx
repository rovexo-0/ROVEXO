import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ROVEXO",
  robots: { index: false, follow: false },
};

export default function SplashLayout({ children }: { children: React.ReactNode }) {
  return children;
}
