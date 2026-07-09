import { signUp } from "@/lib/auth/actions";
import { redirectIfAuthenticated } from "@/lib/auth/guest-redirect";
import { AuthForm, AuthLink } from "@/features/auth/components/AuthForm";
import { RegisterFields } from "@/features/auth/components/RegisterFields";

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return (
    <AuthForm
      title="Create your account"
      description="Create your ROVEXO account with email and password. Complete your profile anytime after signing up."
      action={signUp}
      submitLabel="Create Account"
      footer={
        <p>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </p>
      }
    >
      <RegisterFields />
    </AuthForm>
  );
}
