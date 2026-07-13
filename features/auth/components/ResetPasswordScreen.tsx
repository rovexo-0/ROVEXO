"use client";

import { useActionState, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  AuthBackButton,
  AuthContainer,
  AuthHeading,
  AuthPasswordInput,
  PrimaryButton,
  SecondaryButton,
} from "@/components/auth";
import { RovexoBrandLogo } from "@/components/branding/RovexoBrandLogo";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthSpinner } from "@/features/auth/components/AuthSpinner";
import { updatePassword, type AuthActionState } from "@/lib/auth/actions";
import { scoreResetPassword, validateResetPasswordStrength } from "@/lib/auth/password-strength";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";

export type ResetPasswordTokenState = "valid" | "invalid" | "expired";

type ResetPasswordScreenProps = {
  tokenState: ResetPasswordTokenState;
};

export function ResetPasswordScreen({ tokenState }: ResetPasswordScreenProps) {
  const { copy, routes } = AUTH_MASTER_SPEC.resetPassword;
  const [state, formAction, pending] = useActionState(updatePassword, {} as AuthActionState);
  const [clientError, setClientError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const strength = useMemo(() => scoreResetPassword(password), [password]);
  const alertMessage = clientError ?? state.error;
  const showSuccess = Boolean(state.success);

  if (tokenState === "invalid" || tokenState === "expired") {
    const isExpired = tokenState === "expired";
    return (
      <div
        className="auth-reset-password"
        data-auth-module={AUTH_MODULE_VERSION}
        data-auth-spec={AUTH_MASTER_SPEC.version}
        data-auth-screen="reset-password"
        data-auth-token-state={tokenState}
        data-auth-version="v1.0-legal-lock"
      >
        <AuthBackButton href={routes.back} className="auth-reset-password__back" />
        <AuthContainer>
          <RovexoBrandLogo className="rovexo-brand-logo--auth" />
          <div className="auth-reset-password__token-error" role="alert">
            <AuthHeading
              title={isExpired ? copy.expiredTitle : copy.invalidTitle}
              description={isExpired ? copy.expiredDescription : copy.invalidDescription}
            />
            <div className="auth-reset-password__token-actions">
              <PrimaryButton href={routes.forgotPassword}>{copy.requestNewLink}</PrimaryButton>
              <SecondaryButton href={routes.signIn}>{copy.goToSignIn}</SecondaryButton>
            </div>
          </div>
        </AuthContainer>
      </div>
    );
  }

  return (
    <div
      className="auth-reset-password"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="reset-password"
      data-auth-token-state="valid"
      data-auth-version="v1.0-legal-lock"
    >
      <AuthBackButton href={routes.back} className="auth-reset-password__back" />
      <AuthContainer>
        <RovexoBrandLogo className="rovexo-brand-logo--auth" />

        {showSuccess ? (
          <div className="auth-reset-password__success" role="status" aria-live="polite">
            <AuthHeading title={copy.successTitle} description={copy.successDescription} />
            <PrimaryButton href={routes.signIn}>{copy.goToSignIn}</PrimaryButton>
          </div>
        ) : (
          <>
            <AuthHeading title={copy.title} description={copy.description} />
            <form
              action={formAction}
              className="auth-reset-password__form"
              onSubmit={(event) => {
                setClientError(null);

                if (typeof navigator !== "undefined" && !navigator.onLine) {
                  event.preventDefault();
                  setClientError(copy.offlineError);
                  return;
                }

                if (password !== confirmPassword) {
                  event.preventDefault();
                  setClientError(copy.passwordsMismatch);
                  return;
                }

                const strengthError = validateResetPasswordStrength(password);
                if (strengthError) {
                  event.preventDefault();
                  setClientError(strengthError);
                }
              }}
            >
              {alertMessage ? <AuthAlert message={alertMessage} variant="error" /> : null}

              <div className="auth-form-fields">
                <AuthPasswordInput
                  label={copy.newPasswordLabel}
                  name="password"
                  autoComplete="new-password"
                  placeholder={copy.newPasswordPlaceholder}
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  hint={
                    password ? (
                      <div className="auth-password-strength">
                        <div className="auth-password-strength__bars" aria-hidden>
                          {[1, 2, 3, 4, 5].map((step) => (
                            <span
                              key={step}
                              className={cn(
                                "auth-password-strength__bar",
                                step <= strength.score && "auth-password-strength__bar--filled",
                              )}
                            />
                          ))}
                        </div>
                        <span className="auth-password-strength__label">{strength.label}</span>
                      </div>
                    ) : (
                      <p className="auth-password-strength__hint">{copy.passwordHint}</p>
                    )
                  }
                />
                <AuthPasswordInput
                  label={copy.confirmPasswordLabel}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder={copy.confirmPasswordPlaceholder}
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  hint={
                    confirmPassword && confirmPassword !== password ? (
                      <p className="auth-password-strength__hint text-danger" role="alert">
                        {copy.passwordsMismatch}
                      </p>
                    ) : null
                  }
                />
              </div>

              <PrimaryButton type="submit" disabled={pending} aria-busy={pending} data-testid="auth-submit">
                {pending ? (
                  <span className="auth-reset-password__submit-pending">
                    <AuthSpinner className="h-5 w-5" />
                    {copy.submitting}
                  </span>
                ) : (
                  copy.submit
                )}
              </PrimaryButton>
            </form>
          </>
        )}
      </AuthContainer>
    </div>
  );
}
