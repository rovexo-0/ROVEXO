"use client";

import { useActionState, useState } from "react";
import {
  AuthBackButton,
  AuthContainer,
  AuthFooter,
  AuthHeading,
  AuthIconInput,
  AuthOfficialLogo,
  AuthPasswordInput,
  Checkbox,
  Divider,
  PrimaryButton,
  SocialLogin,
} from "@/components/auth";
import { MailLineIcon } from "@/components/icons/RvxLineIcons";
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

export function LoginScreen({ next, initialError }: LoginScreenProps) {
  const { copy, socialProviders, routes } = AUTH_MASTER_SPEC.login;
  const [state, formAction, pending] = useActionState(signIn, {} as AuthActionState);
  const [clientError, setClientError] = useState<string | null>(null);
  const alertMessage = clientError ?? state.error ?? initialError;

  return (
    <div
      className="auth-login"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="login"
      data-auth-version="v1.0-legal-lock"
    >
      <AuthBackButton href={routes.back} className="auth-login__back" />
      <AuthContainer>
        <AuthOfficialLogo />
        <AuthHeading title={copy.title} description={copy.description} />

        <form
          action={formAction}
          className="auth-login__form"
          onSubmit={() => setClientError(null)}
        >
          {next ? <input type="hidden" name="next" value={next} /> : null}
          {alertMessage ? <AuthAlert message={alertMessage} variant="error" /> : null}

          <div className="auth-form-fields">
            <AuthIconInput
              label={copy.emailLabel}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={copy.emailPlaceholder}
              icon={<MailLineIcon className="auth-icon-field__svg" />}
            />
            <AuthPasswordInput
              label={copy.passwordLabel}
              name="password"
              autoComplete="current-password"
              placeholder={copy.passwordPlaceholder}
            />
          </div>

          <div className="auth-login__meta">
            <Checkbox name="remember" label={copy.rememberMe} defaultChecked className="auth-login__remember" />
            <AuthLink href="/forgot-password" className="auth-login__forgot">
              {copy.forgotPassword}
            </AuthLink>
          </div>

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
        </form>

        <Divider label={copy.divider} />
        <SocialLogin
          next={next}
          providers={socialProviders}
          labels={{
            apple: copy.socialLabels.apple,
            google: copy.socialLabels.google,
            facebook: copy.socialLabels.facebook,
          }}
        />

        <AuthFooter className="auth-login__footer">
          <p className="auth-login__register-prompt">
            {copy.footerPrefix}{" "}
            <AuthLink href="/register">{copy.createAccount}</AuthLink>
          </p>
        </AuthFooter>
      </AuthContainer>
    </div>
  );
}
