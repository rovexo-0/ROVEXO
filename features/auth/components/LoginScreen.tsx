"use client";

import { useActionState, useState } from "react";
import {
  AuthContainer,
  AuthFooter,
  AuthHeading,
  AuthIconInput,
  AuthPasswordInput,
  Checkbox,
  Divider,
  PrimaryButton,
  SocialLogin,
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

/** Premium marketplace social row — Apple + Google (Facebook OAuth preserved in SSOT). */
const PREMIUM_SOCIAL = ["apple", "google"] as const;

/**
 * ROVEXO LOGIN_UI_FINAL_LOCK — presentation only.
 * Layout / hierarchy / auth logic locked. Micro polish only.
 */
const LOGIN_UI = {
  title: "Welcome back",
  description: "Good to see you again.",
  emailLabel: "Email address",
  passwordLabel: "Password",
  rememberMe: "Remember me",
  forgotPassword: "Forgot password?",
  divider: "Continue with",
  createAccount: "Create Account",
  trustTitle: "Protected Sign-in",
  trustCopy: "Your data is encrypted and secure.",
  socialLabels: {
    apple: "Apple",
    google: "Google",
    facebook: "Facebook",
  },
} as const;

export function LoginScreen({ next, initialError }: LoginScreenProps) {
  const { copy } = AUTH_MASTER_SPEC.login;
  const [state, formAction, pending] = useActionState(signIn, {} as AuthActionState);
  const [clientError, setClientError] = useState<string | null>(null);
  const alertMessage = clientError ?? state.error ?? initialError;

  return (
    <div
      className="auth-login auth-login--premium"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="login"
      data-auth-version="v1.0-legal-lock"
      data-auth-ui="v1.0-ui-lock"
    >
      <AuthContainer>
        <div className="auth-login__brand">
          <RovexoBrandLogo className="rovexo-brand-logo--auth" />
        </div>
        <div className="auth-login__intro">
          <AuthHeading title={LOGIN_UI.title} description={LOGIN_UI.description} />
        </div>

        <form
          action={formAction}
          className="auth-login__form"
          onSubmit={() => setClientError(null)}
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

        <div className="auth-login__social">
          <Divider label={LOGIN_UI.divider} />
          <SocialLogin next={next} providers={PREMIUM_SOCIAL} labels={LOGIN_UI.socialLabels} />
        </div>

        <AuthFooter className="auth-login__footer">
          <p className="auth-login__register-prompt">
            {copy.footerPrefix}{" "}
            <AuthLink href="/register" className="auth-login__register-cta">
              {LOGIN_UI.createAccount}
            </AuthLink>
          </p>
        </AuthFooter>
      </AuthContainer>
    </div>
  );
}
