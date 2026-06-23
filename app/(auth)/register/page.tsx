import { signUp } from "@/lib/auth/actions";
import { AuthForm, AuthLink } from "@/features/auth/components/AuthForm";
import { RegisterFields } from "@/features/auth/components/RegisterFields";

export default function RegisterPage() {
  return (
    <AuthForm
      title="Create your account"
      description="Join ROVEXO to buy, sell, and manage your marketplace activity."
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
