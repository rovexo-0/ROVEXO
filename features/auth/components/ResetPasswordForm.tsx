"use client";

import { updatePassword } from "@/lib/auth/actions";
import {
  AuthForm,
  AuthLink,
  ResetPasswordFields,
} from "@/features/auth/components/AuthForm";

export function ResetPasswordForm() {
  return (
    <AuthForm
      title="Choose a new password"
      description="Create a strong password to secure your ROVEXO account."
      action={updatePassword}
      submitLabel="Update Password"
      beforeSubmit={(formData) => {
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        if (password.length < 8) {
          return "Password must be at least 8 characters.";
        }

        if (password !== confirmPassword) {
          return "Passwords do not match.";
        }

        return null;
      }}
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
    >
      <ResetPasswordFields />
    </AuthForm>
  );
}
