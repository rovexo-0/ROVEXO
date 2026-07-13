"use client";

import { useActionState, useState } from "react";
import {
  AuthBackButton,
  AuthContainer,
  AuthFooter,
  AuthHeading,
  AuthIconInput,
  PrimaryButton,
  SecondaryButton,
} from "@/components/auth";
import { RovexoBrandLogo } from "@/components/branding/RovexoBrandLogo";
import { MailLineIcon } from "@/components/icons/RvxLineIcons";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthLink } from "@/features/auth/components/AuthLink";
import { AuthSpinner } from "@/features/auth/components/AuthSpinner";
import { requestPasswordReset, type AuthActionState } from "@/lib/auth/actions";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";

export function ForgotPasswordScreen() {
  const { copy, routes } = AUTH_MASTER_SPEC.forgotPassword;
  const [state, formAction, pending] = useActionState(requestPasswordReset, {} as AuthActionState);
  const [clientError, setClientError] = useState<string | null>(null);
  const alertMessage = clientError ?? state.error;
  const showSuccess = Boolean(state.success);

  return (
    <div
      className="auth-forgot-password"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="forgot-password"
      data-auth-version="v1.0-legal-lock"
    >
      <AuthBackButton href={routes.back} className="auth-forgot-password__back" />
      <AuthContainer>
        <RovexoBrandLogo className="rovexo-brand-logo--auth" />

        {showSuccess ? (
          <div className="auth-forgot-password__success" role="status" aria-live="polite">
            <AuthHeading title={copy.successTitle} description={copy.successDescription} />
            <div className="auth-forgot-password__success-actions">
              <PrimaryButton href={routes.openEmail}>{copy.openEmailApp}</PrimaryButton>
              <SecondaryButton href={routes.signIn}>{copy.backToSignIn}</SecondaryButton>
            </div>
          </div>
        ) : (
          <>
            <AuthHeading title={copy.title} description={copy.description} />
            <form
              action={formAction}
              className="auth-forgot-password__form"
              onSubmit={(event) => {
                setClientError(null);
                if (typeof navigator !== "undefined" && !navigator.onLine) {
                  event.preventDefault();
                  setClientError(copy.offlineError);
                }
              }}
            >
              {alertMessage ? <AuthAlert message={alertMessage} variant="error" /> : null}

              <div className="auth-form-fields">
                <AuthIconInput
                  label={copy.emailLabel}
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder={copy.emailPlaceholder}
                  autoFocus
                  icon={<MailLineIcon className="auth-icon-field__svg" />}
                />
              </div>

              <PrimaryButton type="submit" disabled={pending} aria-busy={pending} data-testid="auth-submit">
                {pending ? (
                  <span className="auth-forgot-password__submit-pending">
                    <AuthSpinner className="h-5 w-5" />
                    {copy.submitting}
                  </span>
                ) : (
                  copy.submit
                )}
              </PrimaryButton>
            </form>

            <AuthFooter className="auth-forgot-password__footer">
              <p className="auth-forgot-password__sign-in-prompt">
                <AuthLink href={routes.signIn}>{copy.backToSignIn}</AuthLink>
              </p>
            </AuthFooter>
          </>
        )}
      </AuthContainer>
    </div>
  );
}
