"use client";

import { useActionState, useState } from "react";
import {
  AuthContainer,
  AuthFooter,
  AuthIconInput,
  AuthPasswordInput,
  Checkbox,
  PrimaryButton,
} from "@/components/auth";
import { RovexoBrandLogo } from "@/components/branding/RovexoBrandLogo";
import { MailLineIcon, ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthLink } from "@/features/auth/components/AuthLink";
import { AuthSpinner } from "@/features/auth/components/AuthSpinner";
import { signIn, type AuthActionState } from "@/lib/auth/actions";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";

type LoginScreenProps = {
  next?: string;
  initialError?: string;
};

/**
 * ROVEXO LOGIN — Owner Canonical Freeze (LOCKED · FROZEN · CERTIFIED).
 * RX + BUY • SELL • GROW → Email → Password → Remember → Forgot → Sign In
 * → Secure Sign In → Create Account.
 * Forbidden: Welcome heading · subtitle · redesign without Owner approval.
 */
const LOGIN_UI = {
  emailLabel: "Email Address",
  passwordLabel: "Password",
  rememberMe: "Remember Me",
  forgotPassword: "Forgot Password?",
  footerPrefix: "New to ROVEXO?",
  createAccount: "Create Account",
  trustTitle: "SECURE SIGN IN",
  trustCopy: "Your data is protected.",
} as const;

export function LoginScreen({ next, initialError }: LoginScreenProps) {
  const { copy } = AUTH_MASTER_SPEC.login;
  const [state, formAction, pending] = useActionState(signIn, {} as AuthActionState);
  const [clientError, setClientError] = useState<string | null>(null);
  const alertMessage = clientError ?? state.error ?? initialError;

  return (
    <div
      className="auth-login auth-login--premium auth-platform-theme auth-compact-premium auth-login--canonical-freeze"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="login"
      data-auth-version="canonical-freeze-v1"
      data-auth-ui="canonical-freeze-v1"
      data-login-engine="canonical-freeze-v1"
      data-auth-freeze="LOCKED_FROZEN_CERTIFIED"
      data-auth-brand-freeze="XXXIX"
      data-auth-experience-freeze="XLI"
    >
      <AuthContainer>
        <div className="auth-login__brand">
          <RovexoBrandLogo className="rovexo-brand-logo--auth" />
        </div>

        <form
          action={formAction}
          className="auth-login__form"
          onSubmit={(event) => {
            setClientError(null);
            const form = event.currentTarget;
            const email = String(new FormData(form).get("email") ?? "").trim();
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              event.preventDefault();
              setClientError("Invalid email address.");
            }
          }}
        >
          {next ? <input type="hidden" name="next" value={next} /> : null}
          {alertMessage ? <AuthAlert message={alertMessage} variant="error" /> : null}

          <div className="auth-form-fields auth-login__fields">
            <AuthIconInput
              label={LOGIN_UI.emailLabel}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={copy.emailPlaceholder}
              icon={<MailLineIcon className="auth-icon-field__svg" />}
            />
            <AuthPasswordInput
              label={LOGIN_UI.passwordLabel}
              name="password"
              autoComplete="current-password"
              placeholder={copy.passwordPlaceholder}
            />
          </div>

          <div className="auth-login__meta">
            <Checkbox
              name="remember"
              label={LOGIN_UI.rememberMe}
              defaultChecked
              className="auth-login__remember"
            />
            <AuthLink href="/forgot-password" className="auth-login__forgot">
              {LOGIN_UI.forgotPassword}
            </AuthLink>
          </div>

          <div className="auth-login__cta">
            <PrimaryButton type="submit" disabled={pending} aria-busy={pending} data-testid="auth-submit">
              {pending ? (
                <span className="auth-login__submit-pending">
                  <AuthSpinner className="h-5 w-5" />
                  {copy.submitting}
                </span>
              ) : (
                copy.signIn
              )}
            </PrimaryButton>
            <div className="auth-login__trust" role="note">
              <p className="auth-login__trust-title">
                <ShieldLineIcon className="auth-login__trust-icon" aria-hidden />
                <span>{LOGIN_UI.trustTitle}</span>
              </p>
              <p className="auth-login__trust-copy">{LOGIN_UI.trustCopy}</p>
            </div>
          </div>
        </form>

        <AuthFooter className="auth-login__footer">
          <p className="auth-login__register-prompt">
            <span className="auth-login__register-prefix">{LOGIN_UI.footerPrefix}</span>
            {" "}
            <AuthLink href="/register" className="auth-login__register-cta">
              {LOGIN_UI.createAccount}
            </AuthLink>
          </p>
        </AuthFooter>
      </AuthContainer>
    </div>
  );
}
