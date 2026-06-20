import { requestPasswordReset } from "@/lib/auth/actions";
import {
  AuthField,
  AuthFieldGroup,
  AuthForm,
  AuthLink,
} from "@/features/auth/components/AuthForm";

export default function ForgotPasswordPage() {
  return (
    <AuthForm
      title="Reset your password"
      description="Enter the email linked to your account and we will send you a secure reset link."
      action={requestPasswordReset}
      submitLabel="Send Reset Link"
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
    >
      <AuthFieldGroup>
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />
      </AuthFieldGroup>
    </AuthForm>
  );
}
