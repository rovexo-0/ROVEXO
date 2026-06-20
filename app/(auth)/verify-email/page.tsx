import { resendVerificationEmail } from "@/lib/auth/actions";
import {
  AuthField,
  AuthFieldGroup,
  AuthForm,
  AuthLink,
} from "@/features/auth/components/AuthForm";

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { email } = await searchParams;

  return (
    <AuthForm
      title="Verify your email"
      description="We sent a confirmation link to your inbox. Verify your email to activate your account."
      action={resendVerificationEmail}
      submitLabel="Resend Verification Email"
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
    >
      <AuthFieldGroup>
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={email}
          placeholder="you@example.com"
        />
      </AuthFieldGroup>
    </AuthForm>
  );
}
