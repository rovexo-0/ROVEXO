import { signIn } from "@/lib/auth/actions";
import { redirectIfAuthenticated } from "@/lib/auth/guest-redirect";
import { AUTH_ERROR_MESSAGES } from "@/lib/auth/redirects";
import {
  AuthField,
  AuthFieldGroup,
  AuthForm,
  AuthLink,
} from "@/features/auth/components/AuthForm";
import { AuthPasswordField } from "@/features/auth/components/AuthPasswordField";
import { LoginRememberRow } from "@/features/auth/components/LoginRememberRow";
import { AUTH_EMAIL_PLACEHOLDER } from "@/lib/email/constants";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  await redirectIfAuthenticated(next);

  const initialError = error
    ? AUTH_ERROR_MESSAGES[error] ?? "Unable to sign in. Please try again."
    : undefined;

  return (
    <AuthForm
      title="Welcome back 👋"
      description="Great to see you again. Continue buying, selling and growing your ROVEXO journey."
      action={signIn}
      submitLabel="Sign In"
      initialError={initialError}
      oauthNext={next}
      footer={
        <p>
          New to ROVEXO? <AuthLink href="/register">Create Free Account</AuthLink>
        </p>
      }
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <AuthFieldGroup>
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={AUTH_EMAIL_PLACEHOLDER}
        />
        <AuthPasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
        />
      </AuthFieldGroup>
      <div className="flex items-center justify-between gap-ds-3">
        <LoginRememberRow />
        <AuthLink href="/forgot-password" className="shrink-0 text-sm">
          Forgot Password
        </AuthLink>
      </div>
    </AuthForm>
  );
}
