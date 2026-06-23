"use client";

import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/actions";
import {
  AuthField,
  AuthFieldGroup,
  AuthForm,
  AuthLink,
} from "@/features/auth/components/AuthForm";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  return (
    <AuthForm
      title="Reset your password"
      description="Enter the email linked to your account and we will send you a secure reset link."
      action={requestPasswordReset}
      submitLabel="Send Reset Link"
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
      successContent={
        <>
          <div className="flex flex-col items-center gap-ds-6 text-center">
            <PublishedCheckmark />
            <div className="flex flex-col gap-ds-2">
              <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Check your email</h1>
              <p className="text-[15px] leading-relaxed text-text-secondary">
                If an account exists for that address, we sent a secure link to reset your password.
                Check your inbox and spam folder.
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-ds-3">
              <Link href="/login" className="block w-full">
                <Button variant="primary" fullWidth size="lg" className="min-h-[50px] rounded-ds-xl">
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        </>
      }
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
