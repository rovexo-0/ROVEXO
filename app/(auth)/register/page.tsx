import { redirect } from "next/navigation";
import { redirectIfAuthenticated } from "@/lib/auth/guest-redirect";
import { AUTH_ERROR_MESSAGES } from "@/lib/auth/redirects";
import { loadPublicOauthProviders } from "@/lib/auth/oauth-provider-availability.server";
import { RegisterScreen } from "@/features/auth/components/RegisterScreen";
import { isPublicRegistrationEnabled } from "@/lib/launch-certification/private-mode";

export const metadata = {
  title: "Create Account",
  robots: { index: false, follow: false },
};

type RegisterPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { next, error } = await searchParams;
  const oauthProvidersPromise = loadPublicOauthProviders();
  await redirectIfAuthenticated(next);

  if (!isPublicRegistrationEnabled()) {
    redirect("/login?certification=registration-disabled");
  }

  const initialError = error
    ? AUTH_ERROR_MESSAGES[error] ?? "Unable to continue. Please try again."
    : undefined;

  const oauthProviders = await oauthProvidersPromise;

  return (
    <RegisterScreen
      next={next}
      initialError={initialError}
      oauthProviders={oauthProviders}
    />
  );
}
