"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { cn } from "@/lib/cn";
import {
  AuthBackButton,
  AuthContainer,
  AuthFooter,
  AuthIconInput,
  AuthPasswordInput,
  PrimaryButton,
} from "@/components/auth";
import { RovexoBrandLogo } from "@/components/branding/RovexoBrandLogo";
import { MailLineIcon, ShieldLineIcon, UserLineIcon } from "@/components/icons/RvxLineIcons";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthLink } from "@/features/auth/components/AuthLink";
import { AuthSpinner } from "@/features/auth/components/AuthSpinner";
import { signUp, type AuthActionState } from "@/lib/auth/actions";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";
import { focusRing } from "@/components/ui/tokens";

/**
 * ROVEXO REGISTER — Owner Canonical Freeze (LOCKED · FROZEN · CERTIFIED).
 * RX + BUY • SELL • GROW → fields → Terms → Optional marketing → Create Free Account
 * → Secure Registration → Sign In.
 * Forbidden: Join heading · structural redesign without Owner approval.
 */
const REGISTER_UI = {
  fullNameLabel: "Full Name",
  emailLabel: "Email Address",
  passwordLabel: "Password",
  confirmPasswordLabel: "Confirm Password",
  termsLabel: "Terms and Conditions",
  marketing: "Receive ROVEXO news and offers (OPTIONAL)",
  submit: "Create Free Account",
  trustTitle: "SECURE REGISTRATION",
  trustCopy: "Your account is protected.",
  signIn: "Sign In",
} as const;

function resolveRegisterClientError(form: HTMLFormElement): string | null {
  const data = new FormData(form);
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  const confirmPassword = String(data.get("confirmPassword") ?? "");

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Invalid email address.";
  }
  if (password.length > 0 && password.length < 8) {
    return "Password must contain at least 8 characters.";
  }
  if (password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}

export function RegisterScreen() {
  const { copy, routes } = AUTH_MASTER_SPEC.register;
  const [state, formAction, pending] = useActionState(signUp, {} as AuthActionState);
  const [clientError, setClientError] = useState<string | null>(null);
  const alertMessage = clientError ?? state.error;

  return (
    <div
      className="auth-register auth-register--premium auth-platform-theme auth-compact-premium auth-register--canonical-freeze"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="register"
      data-auth-version="canonical-freeze-v1"
      data-auth-ui="canonical-freeze-v1"
      data-register-engine="canonical-freeze-v1"
      data-auth-freeze="LOCKED_FROZEN_CERTIFIED"
      data-auth-brand-freeze="XXXIX"
      data-register-visual-polish="XL"
      data-auth-experience-freeze="XLI"
    >
      <AuthBackButton href={routes.back} className="auth-register__back auth-back-button--platform" />
      <AuthContainer>
        <div className="auth-register__brand">
          <RovexoBrandLogo className="rovexo-brand-logo--auth" />
        </div>

        <form
          action={formAction}
          className="auth-register__form"
          onSubmit={(event) => {
            const message = resolveRegisterClientError(event.currentTarget);
            if (message) {
              event.preventDefault();
              setClientError(message);
              return;
            }
            setClientError(null);
          }}
        >
          {alertMessage ? <AuthAlert message={alertMessage} variant="error" /> : null}

          <div className="auth-form-fields">
            <AuthIconInput
              label={REGISTER_UI.fullNameLabel}
              name="fullName"
              autoComplete="name"
              placeholder={copy.fullNamePlaceholder}
              icon={<UserLineIcon className="auth-icon-field__svg" />}
            />
            <AuthIconInput
              label={REGISTER_UI.emailLabel}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={copy.emailPlaceholder}
              icon={<MailLineIcon className="auth-icon-field__svg" />}
            />
            <AuthPasswordInput
              label={REGISTER_UI.passwordLabel}
              name="password"
              autoComplete="new-password"
              placeholder={copy.passwordPlaceholder}
              minLength={8}
            />
            <AuthPasswordInput
              label={REGISTER_UI.confirmPasswordLabel}
              name="confirmPassword"
              autoComplete="new-password"
              placeholder={copy.confirmPasswordPlaceholder}
              minLength={8}
            />
          </div>

          <div className="auth-register__checkboxes">
            <label className={cn("auth-register-checkbox", focusRing)}>
              <input type="checkbox" name="terms" required className="auth-register-checkbox__input" />
              <span className="auth-register-checkbox__text">
                <Link href="/legal/terms-and-conditions" className="auth-register-checkbox__link">
                  {REGISTER_UI.termsLabel}
                </Link>
              </span>
            </label>
            <label className={cn("auth-register-checkbox", focusRing)}>
              <input type="checkbox" name="marketing" className="auth-register-checkbox__input" />
              <span className="auth-register-checkbox__text">{REGISTER_UI.marketing}</span>
            </label>
          </div>

          <div className="auth-register__cta">
            <PrimaryButton type="submit" disabled={pending} aria-busy={pending} data-testid="auth-submit">
              {pending ? (
                <span className="auth-register__submit-pending">
                  <AuthSpinner className="h-5 w-5" />
                  {copy.submitting}
                </span>
              ) : (
                REGISTER_UI.submit
              )}
            </PrimaryButton>
            <div className="auth-register__trust" role="note">
              <p className="auth-register__trust-title">
                <ShieldLineIcon className="auth-register__trust-icon" aria-hidden />
                <span>{REGISTER_UI.trustTitle}</span>
              </p>
              <p className="auth-register__trust-copy">{REGISTER_UI.trustCopy}</p>
            </div>
          </div>
        </form>

        <AuthFooter className="auth-register__footer">
          <p className="auth-register__sign-in-prompt">
            <AuthLink href={routes.signIn}>{REGISTER_UI.signIn}</AuthLink>
          </p>
        </AuthFooter>
      </AuthContainer>
    </div>
  );
}
