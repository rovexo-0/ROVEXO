import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MfaChallengeScreen } from "@/features/auth/components/MfaChallengeScreen";
import { mfaChallengeHref, readMfaAssurance } from "@/lib/auth/mfa";
import { sanitizeNextPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Two-Factor Authentication",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

type MfaPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function MfaChallengePage({ searchParams }: MfaPageProps) {
  const { next: rawNext } = await searchParams;
  const next = sanitizeNextPath(rawNext);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const assurance = await readMfaAssurance(supabase);
  if (!assurance.requiresChallenge) {
    redirect(next);
  }

  // Keep URL canonical when next is default.
  if (!rawNext && next === "/") {
    void mfaChallengeHref();
  }

  return <MfaChallengeScreen next={next} />;
}
