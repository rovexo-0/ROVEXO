import type { Metadata, Viewport } from "next";
import { redirectIfAuthenticated } from "@/lib/auth/guest-redirect";
import { AUTH_ERROR_MESSAGES } from "@/lib/auth/redirects";
import { LoginScreen } from "@/features/auth/components/LoginScreen";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  await redirectIfAuthenticated(next);

  const initialError = error
    ? AUTH_ERROR_MESSAGES[error] ?? "Unable to sign in. Please try again."
    : undefined;

  return <LoginScreen next={next} initialError={initialError} />;
}
