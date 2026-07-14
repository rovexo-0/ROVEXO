"use client";

import {
  AuthContainer,
  AuthFooter,
  AuthHeading,
  Divider,
  PrimaryButton,
  SecondaryButton,
  SocialLogin,
} from "@/components/auth";
import { RovexoBrandLogo } from "@/components/branding/RovexoBrandLogo";
import { ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { AuthLink } from "@/features/auth/components/AuthLink";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";

/** Premium welcome social row — Apple + Google (Facebook OAuth preserved in SSOT). */
const WELCOME_SOCIAL = ["apple", "google"] as const;

/**
 * ROVEXO WELCOME_SCREEN_MASTER_SPEC presentation.
 * Master-spec routes/actions untouched — Login / Register / Splash not modified.
 */
const WELCOME_UI = {
  description: "Buy. Sell. Grow.\nBuilt for serious buyers and sellers.",
  trustTitle: "Protected Authentication",
  trustCopy: "Secure sign-in for buyers and sellers.",
} as const;

export function WelcomeScreen() {
  const { copy, routes } = AUTH_MASTER_SPEC.welcome;

  return (
    <div
      className="auth-welcome auth-welcome--premium"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="welcome"
      data-auth-ui="v1.0-welcome-ready"
      data-welcome-lock="CANONICAL"
    >
      <AuthContainer>
        <div className="auth-welcome__brand">
          <RovexoBrandLogo className="rovexo-brand-logo--auth" />
        </div>

        <div className="auth-welcome__intro">
          <AuthHeading title={copy.title} description={WELCOME_UI.description} />
        </div>

        <div className="auth-welcome__actions">
          <PrimaryButton href={routes.signIn}>{copy.signIn}</PrimaryButton>
          <SecondaryButton href={routes.register}>{copy.createAccount}</SecondaryButton>
        </div>

        <div className="auth-welcome__trust" role="note">
          <p className="auth-welcome__trust-title">
            <ShieldLineIcon className="auth-welcome__trust-icon" aria-hidden />
            <span>{WELCOME_UI.trustTitle}</span>
          </p>
          <p className="auth-welcome__trust-copy">{WELCOME_UI.trustCopy}</p>
        </div>

        <div className="auth-welcome__social">
          <Divider label={copy.divider} />
          <SocialLogin
            providers={WELCOME_SOCIAL}
            labels={{
              apple: copy.socialLabels.apple,
              google: copy.socialLabels.google,
              facebook: copy.socialLabels.facebook,
            }}
          />
        </div>

        <AuthFooter className="auth-welcome__footer">
          <p className="auth-welcome__legal">
            {copy.footerPrefix}{" "}
            <AuthLink href={routes.terms}>{copy.termsLabel}</AuthLink>{" "}
            <AuthLink href={routes.privacy}>{copy.privacyLabel}</AuthLink>
          </p>
        </AuthFooter>
      </AuthContainer>
    </div>
  );
}
