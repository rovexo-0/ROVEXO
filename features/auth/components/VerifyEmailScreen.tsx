"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AuthContainer,
  AuthHeading,
  PrimaryButton,
  SecondaryButton,
} from "@/components/auth";
import { RovexoBrandLogo } from "@/components/branding/RovexoBrandLogo";
import { CheckLineIcon, MailLineIcon, ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthLink } from "@/features/auth/components/AuthLink";
import {
  confirmEmailVerification,
  resendVerificationEmail,
} from "@/lib/auth/actions";
import { AUTH_MODULE_VERSION } from "@/lib/auth/canonical";
import { EMAIL_VERIFICATION_UX_V1 } from "@/lib/auth/email-verification-ux-v1";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";

type VerifyPhase = "created" | "verifying" | "success" | "expired";

type VerifyEmailScreenProps = {
  email: string;
  tokenHash: string | null;
  otpType: string | null;
  code: string | null;
  status: string | null;
};

export function VerifyEmailScreen({
  email,
  tokenHash,
  otpType,
  code,
  status,
}: VerifyEmailScreenProps) {
  const { copy, verifyingMinMs, resendCooldownSec, openEmailHref, route } =
    EMAIL_VERIFICATION_UX_V1;
  const router = useRouter();
  const hasToken = Boolean((tokenHash && otpType) || code);
  const initialPhase: VerifyPhase =
    status === "success" || status === "verified"
      ? "success"
      : hasToken
        ? "verifying"
        : "created";

  const [phase, setPhase] = useState<VerifyPhase>(initialPhase);
  const [cooldown, setCooldown] = useState<number>(resendCooldownSec);
  const [resendPending, setResendPending] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const verifyStarted = useRef(false);

  useEffect(() => {
    if (phase !== "created" && phase !== "expired") return;
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, cooldown]);

  useEffect(() => {
    if (phase !== "verifying" || verifyStarted.current) return;
    verifyStarted.current = true;

    const startedAt = Date.now();

    startTransition(async () => {
      const result = await confirmEmailVerification({
        tokenHash,
        type: otpType,
        code,
      });

      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, verifyingMinMs - elapsed);
      if (wait > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, wait));
      }

      if (result.ok) {
        setPhase("success");
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", `${route}?status=success`);
        }
        return;
      }

      setPhase("expired");
    });
  }, [phase, tokenHash, otpType, code, verifyingMinMs, route]);

  useEffect(() => {
    if (phase !== "success") return;
    const id = window.setTimeout(() => {
      router.replace(AUTH_MASTER_SPEC.routes.home);
      router.refresh();
    }, 1600);
    return () => window.clearTimeout(id);
  }, [phase, router]);

  const resendDisabled =
    resendPending || isPending || cooldown > 0 || !email.trim();

  async function handleResend() {
    if (resendDisabled) return;
    setResendPending(true);
    setAlertMessage(null);
    const formData = new FormData();
    formData.set("email", email);
    const result = await resendVerificationEmail({}, formData);
    setResendPending(false);
    if (result.error) {
      setAlertMessage(result.error);
      return;
    }
    setCooldown(resendCooldownSec);
    setPhase("created");
  }

  return (
    <div
      className="auth-verify-email auth-platform-theme"
      data-auth-module={AUTH_MODULE_VERSION}
      data-auth-spec={AUTH_MASTER_SPEC.version}
      data-auth-screen="verify-email"
      data-email-verification-ux={EMAIL_VERIFICATION_UX_V1.version}
      data-verify-phase={phase}
      data-oauth="forbidden"
    >
      <AuthContainer className="auth-verify-email__container">
        <RovexoBrandLogo className="rovexo-brand-logo--auth" />

        {phase === "created" ? (
          <div className="auth-verify-email__panel" role="status" aria-live="polite">
            <div className="auth-verify-email__icon auth-verify-email__icon--created" aria-hidden>
              <CheckLineIcon className="auth-verify-email__icon-svg" />
            </div>
            <AuthHeading title={copy.created.title} description={copy.created.subtitle} />
            {email ? (
              <div className="auth-verify-email__email-chip">
                <MailLineIcon className="auth-verify-email__email-icon" />
                <span>{email}</span>
              </div>
            ) : null}
            {alertMessage ? <AuthAlert message={alertMessage} variant="error" /> : null}
            <div className="auth-verify-email__actions">
              <PrimaryButton href={openEmailHref}>{copy.created.openEmail}</PrimaryButton>
              <button
                type="button"
                className="auth-verify-email__resend-link"
                disabled={resendDisabled}
                onClick={() => {
                  void handleResend();
                }}
              >
                {cooldown > 0
                  ? copy.created.resendCooldown(cooldown)
                  : copy.created.resend}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "verifying" ? (
          <div className="auth-verify-email__panel" role="status" aria-live="polite">
            <div className="auth-verify-email__icon auth-verify-email__icon--verifying" aria-hidden>
              <ShieldLineIcon className="auth-verify-email__icon-svg" />
            </div>
            <AuthHeading
              title={copy.verifying.title}
              description={copy.verifying.subtitle}
            />
            <div className="auth-verify-email__progress" aria-hidden>
              <div className="auth-verify-email__progress-bar" />
            </div>
          </div>
        ) : null}

        {phase === "success" ? (
          <div className="auth-verify-email__panel" role="status" aria-live="polite">
            <div className="auth-verify-email__success-burst" aria-hidden>
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="auth-verify-email__icon auth-verify-email__icon--success" aria-hidden>
              <CheckLineIcon className="auth-verify-email__icon-svg" />
            </div>
            <AuthHeading title={copy.success.title} description={copy.success.subtitle} />
            <div className="auth-verify-email__actions">
              <PrimaryButton
                type="button"
                onClick={() => {
                  router.replace(AUTH_MASTER_SPEC.routes.home);
                  router.refresh();
                }}
              >
                {copy.success.continueCta}
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {phase === "expired" ? (
          <div className="auth-verify-email__panel" role="alert" aria-live="assertive">
            <div className="auth-verify-email__icon auth-verify-email__icon--expired" aria-hidden>
              <MailLineIcon className="auth-verify-email__icon-svg" />
            </div>
            <AuthHeading title={copy.expired.title} description={copy.expired.subtitle} />
            {alertMessage ? <AuthAlert message={alertMessage} variant="error" /> : null}
            <div className="auth-verify-email__actions">
              {email ? (
                <PrimaryButton
                  type="button"
                  disabled={resendDisabled}
                  aria-busy={resendPending}
                  onClick={() => {
                    void handleResend();
                  }}
                >
                  {copy.expired.resend}
                </PrimaryButton>
              ) : (
                <p className="auth-verify-email__hint">
                  <AuthLink href={AUTH_MASTER_SPEC.routes.login}>
                    {copy.expired.backToSignIn}
                  </AuthLink>
                </p>
              )}
              <SecondaryButton href={AUTH_MASTER_SPEC.routes.login}>
                {copy.expired.backToSignIn}
              </SecondaryButton>
            </div>
          </div>
        ) : null}
      </AuthContainer>
    </div>
  );
}
