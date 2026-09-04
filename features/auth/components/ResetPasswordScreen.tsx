"use client";

import { useActionState, useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
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
import { ResetPasswordChecklist } from "@/features/auth/components/ResetPasswordChecklist";
import { ResetPasswordStrengthMeter } from "@/features/auth/components/ResetPasswordStrengthMeter";
import { updatePassword, type AuthActionState } from "@/lib/auth/actions";
import {
  getResetPasswordRequirements,
  mapResetPasswordClientError,
  scoreResetPassword,
  validateResetPasswordStrength,
} from "@/lib/auth/password-strength";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

const RESET_SUCCESS_FLASH_KEY = "rovexo-reset-password-success";

function subscribeResetSuccessFlash() {
  return () => undefined;
}

function getResetSuccessFlashSnapshot(): boolean {
  try {
    return window.sessionStorage.getItem(RESET_SUCCESS_FLASH_KEY) === "1";
  } catch {
    return false;
  }
}

function getResetSuccessFlashServerSnapshot(): boolean {
  return false;
}

export type ResetPasswordTokenState = "valid" | "invalid" | "expired";

type ResetPasswordScreenProps = {
  tokenState: ResetPasswordTokenState;
};

function ResetPasswordSuccessIcon() {
  return (
    <span className="auth-reset-password__success-icon" aria-hidden>
      <PlatformEmoji emoji={PLATFORM_EMOJI.check} size={48} />
    </span>
  );
}

export function ResetPasswordScreen({ tokenState }: ResetPasswordScreenProps) {
  const { copy, routes } = AUTH_MASTER_SPEC.resetPassword;
  const [state, formAction, pending] = useActionState(updatePassword, {} as AuthActionState);
  const [clientError, setClientError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const storedFlashSuccess = useSyncExternalStore(
    subscribeResetSuccessFlash,
    getResetSuccessFlashSnapshot,
    getResetSuccessFlashServerSnapshot,
  );
  const checklistId = useId();
  const strengthId = useId();

  useEffect(() => {
    if (!state.success) return;
    try {
      window.sessionStorage.setItem(RESET_SUCCESS_FLASH_KEY, "1");
    } catch {
      /* ignore */
    }
  }, [state.success]);

  const requirements = useMemo(() => getResetPasswordRequirements(password), [password]);
  const strength = useMemo(() => scoreResetPassword(password), [password]);
  const rawAlertMessage = clientError ?? state.error;
  const alertMessage = mapResetPasswordClientError(rawAlertMessage);
  const showSuccess = Boolean(state.success) || storedFlashSuccess;

  // After updatePassword the action signs out; RSC refresh may re-render with
  // tokenState=invalid. Prefer success when the action already succeeded.
  if (showSuccess) {
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
          <div className="auth-reset-password__success" role="status" aria-live="polite">
            <ResetPasswordSuccessIcon />
            <AuthHeading title={copy.successTitle} description={copy.successDescription} />
            <PrimaryButton
              href={routes.signIn}
              onClick={() => {
                try {
                  window.sessionStorage.removeItem(RESET_SUCCESS_FLASH_KEY);
                } catch {
                  /* ignore */
                }
              }}
            >
              {copy.goToSignIn}
            </PrimaryButton>
          </div>
        </AuthContainer>
      </div>
    );
  }

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

        <AuthHeading title={copy.title} description={copy.description} />
        <form
          action={formAction}
          className="auth-reset-password__form"
          autoComplete="on"
          noValidate
          onSubmit={(event) => {
            setClientError(null);

            if (typeof navigator !== "undefined" && !navigator.onLine) {
              event.preventDefault();
              setClientError(copy.errors.offline);
              return;
            }

            if (password !== confirmPassword) {
              event.preventDefault();
              setClientError(copy.errors.passwordsMismatch);
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
              inputId="reset-password-new"
              autoComplete="new-password"
              placeholder={copy.newPasswordPlaceholder}
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              describedBy={password ? `${checklistId} ${strengthId}` : undefined}
              hint={
                password ? (
                  <div className="auth-reset-password__password-meta">
                    <ResetPasswordChecklist id={checklistId} requirements={requirements} />
                    <ResetPasswordStrengthMeter id={strengthId} strength={strength} hint={undefined} />
                  </div>
                ) : (
                  <p className="auth-password-strength__hint">{copy.passwordHint}</p>
                )
              }
            />
            <AuthPasswordInput
              label={copy.confirmPasswordLabel}
              name="confirmPassword"
              inputId="reset-password-confirm"
              autoComplete="new-password"
              placeholder={copy.confirmPasswordPlaceholder}
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              hint={
                confirmPassword && confirmPassword !== password ? (
                  <p className="auth-password-strength__hint text-danger" role="alert">
                    {copy.errors.passwordsMismatch}
                  </p>
                ) : null
              }
            />
          </div>

          <PrimaryButton
            type="submit"
            disabled={pending}
            aria-busy={pending}
            aria-disabled={pending}
            data-testid="auth-submit"
          >
            {pending ? (
              <span className="auth-reset-password__submit-pending">
                <AuthSpinner className="h-5 w-5" aria-hidden />
                <span>{copy.submitting}</span>
              </span>
            ) : (
              copy.submit
            )}
          </PrimaryButton>
        </form>
      </AuthContainer>
    </div>
  );
}
