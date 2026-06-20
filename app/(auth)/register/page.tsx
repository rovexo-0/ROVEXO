import { signUp } from "@/lib/auth/actions";
import {
  AuthField,
  AuthFieldGroup,
  AuthForm,
  AuthLink,
  AuthSelect,
} from "@/features/auth/components/AuthForm";

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
      <AuthFieldGroup>
        <AuthField label="Full name" name="fullName" autoComplete="name" placeholder="Jane Smith" />
        <AuthField
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="yourname"
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9_]+"
          hint="Lowercase letters, numbers, and underscores only"
        />
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />
      </AuthFieldGroup>

      <AuthFieldGroup className="mt-ds-1">
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="Create a password"
          hint="At least 8 characters"
        />
        <AuthSelect
          label="Account type"
          name="role"
          defaultValue="buyer"
          options={[
            { value: "buyer", label: "Buyer" },
            { value: "seller", label: "Seller" },
            { value: "business", label: "Business" },
          ]}
        />
        <AuthField
          label="Business name"
          name="businessName"
          required={false}
          placeholder="Optional — required for business accounts"
        />
      </AuthFieldGroup>
    </AuthForm>
  );
}
