"use client";

import Link from "next/link";
import { updatePassword } from "@/lib/auth/actions";
import {
  AuthForm,
  AuthLink,
  ResetPasswordFields,
} from "@/features/auth/components/AuthForm";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import { Button } from "@/components/ui/Button";

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
      successContent={
        <div className="flex flex-col items-center gap-ds-6 text-center">
          <PublishedCheckmark />
          <div className="flex flex-col gap-ds-2">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Password updated</h1>
            <p className="text-[15px] leading-relaxed text-text-secondary">
              Your password has been changed. You can now sign in with your new credentials.
            </p>
          </div>
          <Link href="/login" className="block w-full max-w-sm">
            <Button variant="primary" fullWidth size="lg" className="min-h-[50px] rounded-ds-xl">
              Back to sign in
            </Button>
          </Link>
        </div>
      }
    >
      <ResetPasswordFields />
    </AuthForm>
  );
}
