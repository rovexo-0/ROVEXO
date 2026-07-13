"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  AuthBackButton,
  AuthContainer,
  AuthFooter,
  AuthHeading,
  AuthIconInput,
  AuthOfficialLogo,
  AuthPasswordInput,
  Divider,
  PrimaryButton,
  SocialLogin,
} from "@/components/auth";
import { MailLineIcon, UserLineIcon } from "@/components/icons/RvxLineIcons";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthLink } from "@/features/auth/components/AuthLink";
import { AuthSpinner } from "@/features/auth/components/AuthSpinner";
import { signUp, type AuthActionState } from "@/lib/auth/actions";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";
import { focusRing } from "@/components/ui/tokens";

function passwordStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: "" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: "Weak" };
  if (score <= 3) return { score, label: "Fair" };
  if (score <= 4) return { score, label: "Good" };
  return { score, label: "Strong" };
}

export function RegisterScreen() {
  const { copy, socialProviders, routes } = AUTH_MASTER_SPEC.register;
  const [state, formAction, pending] = useActionState(signUp, {} as AuthActionState);
  const [clientError, setClientError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const strength = useMemo(() => passwordStrength(password), [password]);
  const alertMessage = clientError ?? state.error;

  return (
    <div
      className="auth-register"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="register"
      data-auth-version="v1.0-legal-lock"
    >
      <AuthBackButton href={routes.back} className="auth-register__back" />
      <AuthContainer>
        <AuthOfficialLogo />
        <AuthHeading title={copy.title} description={copy.description} />

        <form
          action={formAction}
          className="auth-register__form"
          onSubmit={() => setClientError(null)}
        >
          {alertMessage ? <AuthAlert message={alertMessage} variant="error" /> : null}

          <div className="auth-form-fields">
            <AuthIconInput
              label={copy.fullNameLabel}
              name="fullName"
              autoComplete="name"
              placeholder={copy.fullNamePlaceholder}
              icon={<UserLineIcon className="auth-icon-field__svg" />}
            />
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
              autoComplete="new-password"
              placeholder={copy.passwordPlaceholder}
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
            />
          </div>

          <div className="auth-register__checkboxes">
            <label className={cn("auth-register-checkbox", focusRing)}>
              <input type="checkbox" name="terms" required className="auth-register-checkbox__input" />
              <span className="auth-register-checkbox__text">
                {copy.termsPrefix}{" "}
                <Link href="/legal/terms-and-conditions" className="auth-register-checkbox__link">
                  {copy.termsLabel}
                </Link>
                ,{" "}
                <Link href="/legal/privacy-policy" className="auth-register-checkbox__link">
                  {copy.privacyLabel}
                </Link>
                , and{" "}
                <Link href="/legal/cookie-policy" className="auth-register-checkbox__link">
                  {copy.cookieLabel}
                </Link>
              </span>
            </label>

            <label className={cn("auth-register-checkbox", focusRing)}>
              <input type="checkbox" name="gdpr" required className="auth-register-checkbox__input" />
              <span className="auth-register-checkbox__text">{copy.gdpr}</span>
            </label>

            <label className={cn("auth-register-checkbox", focusRing)}>
              <input type="checkbox" name="marketing" className="auth-register-checkbox__input" />
              <span className="auth-register-checkbox__text">{copy.marketing}</span>
            </label>
          </div>

          <PrimaryButton type="submit" disabled={pending} aria-busy={pending} data-testid="auth-submit">
            {pending ? (
              <span className="auth-register__submit-pending">
                <AuthSpinner className="h-5 w-5" />
                {copy.submitting}
              </span>
            ) : (
              copy.submit
            )}
          </PrimaryButton>
        </form>

        <Divider label={copy.divider} />
        <SocialLogin
          providers={socialProviders}
          labels={{
            apple: copy.socialLabels.apple,
            google: copy.socialLabels.google,
            facebook: copy.socialLabels.facebook,
          }}
        />

        <AuthFooter className="auth-register__footer">
          <p className="auth-register__sign-in-prompt">
            {copy.footerPrefix}{" "}
            <AuthLink href={routes.signIn}>{copy.signIn}</AuthLink>
          </p>
        </AuthFooter>
      </AuthContainer>
    </div>
  );
}
