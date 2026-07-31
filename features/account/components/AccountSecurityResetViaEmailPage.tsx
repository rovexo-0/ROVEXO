"use client";

import { useActionState } from "react";
import { CanonicalInfoBlock, CanonicalSection } from "@/src/components/canonical";
import { MyAccountTemplate } from "@/features/account-canonical";
import { AuthIconInput, PrimaryButton } from "@/components/auth";
import { MailLineIcon } from "@/components/icons/RvxLineIcons";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthSpinner } from "@/features/auth/components/AuthSpinner";
import { requestPasswordReset, type AuthActionState } from "@/lib/auth/actions";

type AccountSecurityResetViaEmailPageProps = {
  email: string;
};

/**
 * Authenticated password-reset entry (Security → Reset via email).
 * Does not use /forgot-password (that page redirects signed-in users home).
 */
export function AccountSecurityResetViaEmailPage({ email }: AccountSecurityResetViaEmailPageProps) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {} as AuthActionState);

  return (
    <MyAccountTemplate
      surface="security"
      title="Reset via email"
      backHref="/account/security"
      backLabel="Security"
      showHeaderTitle
    >
      <div className="settings-subpage-v1 fw-engine__stack" data-full-width-surface="security-reset">
        <CanonicalSection title="Password reset">
          {state.success ? (
            <CanonicalInfoBlock variant="description">
              Check your email for a reset link. Open it to choose a new password.
            </CanonicalInfoBlock>
          ) : (
            <form action={formAction} className="flex w-full flex-col gap-ds-4">
              {state.error ? <AuthAlert message={state.error} variant="error" /> : null}
              <CanonicalInfoBlock variant="description">
                We will send a secure reset link to your account email.
              </CanonicalInfoBlock>
              <AuthIconInput
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={email}
                icon={<MailLineIcon className="auth-icon-field__svg" />}
              />
              <PrimaryButton type="submit" disabled={pending || !email} aria-busy={pending}>
                {pending ? <AuthSpinner /> : "Send reset link"}
              </PrimaryButton>
            </form>
          )}
        </CanonicalSection>
      </div>
    </MyAccountTemplate>
  );
}
