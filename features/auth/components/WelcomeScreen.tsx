"use client";

import {
  AuthContainer,
  AuthFooter,
  AuthHeading,
  AuthLogo,
  Divider,
  PrimaryButton,
  SecondaryButton,
  SocialLogin,
} from "@/components/auth";
import { AuthLink } from "@/features/auth/components/AuthLink";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";

export function WelcomeScreen() {
  const { copy, socialProviders, routes } = AUTH_MASTER_SPEC.welcome;

  return (
    <div
      className="auth-welcome"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="welcome"
    >
      <AuthContainer>
        <AuthLogo />
        <AuthHeading title={copy.title} description={copy.description} />
        <div className="auth-welcome__actions">
          <PrimaryButton href={routes.signIn}>{copy.signIn}</PrimaryButton>
          <SecondaryButton href={routes.register}>{copy.createAccount}</SecondaryButton>
        </div>
        <Divider label={copy.divider} />
        <SocialLogin
          providers={socialProviders}
          labels={{
            apple: copy.socialLabels.apple,
            google: copy.socialLabels.google,
            facebook: copy.socialLabels.facebook,
          }}
        />
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
