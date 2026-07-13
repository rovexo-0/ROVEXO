import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false, follow: false },
};

/** Placeholder — full Welcome screen ships in the next sprint step. */
export default function WelcomePage() {
  return (
    <p className="text-center text-sm text-text-secondary">
      Welcome — review splash, then continue implementation.
    </p>
  );
}
