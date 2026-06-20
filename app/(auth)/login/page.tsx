import { signIn } from "@/lib/auth/actions";
import { AUTH_ERROR_MESSAGES } from "@/lib/auth/redirects";
import {
  AuthField,
  AuthFieldGroup,
  AuthForm,
  AuthLink,
} from "@/features/auth/components/AuthForm";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const initialError = error
    ? AUTH_ERROR_MESSAGES[error] ?? "Unable to sign in. Please try again."
    : undefined;

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to access your account, orders, and messages."
      action={signIn}
      submitLabel="Sign In"
      initialError={initialError}
      footer={
        <div className="flex flex-col gap-ds-3">
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
          <p>
            New to ROVEXO? <AuthLink href="/register">Create an account</AuthLink>
          </p>
        </div>
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
          placeholder="you@example.com"
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
        />
      </AuthFieldGroup>
    </AuthForm>
  );
}
