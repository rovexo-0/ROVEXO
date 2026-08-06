/**
 * ROVEXO EMAIL VERIFICATION UX v1.0 (P0 · COD SÂNGE)
 *
 * Canonical branded verification flow — Supabase backend only (never hosted UI).
 * Route SSOT: `/verify-email`
 */

export const EMAIL_VERIFICATION_UX_V1 = {
  version: "1.0",
  id: "email-verification-ux-v1",
  status: "IMPLEMENTATION",
  route: "/verify-email",
  /** Minimum time on verifying UI before success/error (Owner: 1–2s). */
  verifyingMinMs: 1200,
  resendCooldownSec: 58,
  openEmailHref: "mailto:",
  copy: {
    created: {
      title: "Account created",
      subtitle: "We've sent a verification email.",
      openEmail: "Open Email",
      resend: "Resend email",
      resendCooldown: (seconds: number) => `Resend email (${seconds}s)`,
    },
    verifying: {
      title: "Verifying your email...",
      subtitle: "Please wait a second while we confirm your email address.",
    },
    success: {
      title: "Email verified",
      subtitle: "Your account is now active.",
      continueCta: "Continue to ROVEXO",
    },
    expired: {
      title: "Verification link expired",
      subtitle: "Request a new verification email to activate your account.",
      resend: "Resend verification email",
      backToSignIn: "Back to Sign in",
    },
  },
  emailTemplate: {
    subject: "Confirm your email address",
    greeting: "Welcome to ROVEXO",
    body: "Please confirm your email address to activate your account.",
    cta: "Confirm Email",
    footer: "© ROVEXO Marketplace",
    /** Direct app link — never ConfirmationURL (avoids supabase.co hosted UI). */
    confirmPath: "/verify-email",
    contentPath: "supabase/templates/confirmation.html",
  },
  forbidden: [
    "Powered by Supabase",
    "supabase.co hosted verify UI",
    "raw exceptions",
    "stack traces",
    "duplicate verification routes",
  ] as const,
} as const;

export type EmailVerificationUxV1 = typeof EMAIL_VERIFICATION_UX_V1;

export function authVerifyEmailRedirectUrl(appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}${EMAIL_VERIFICATION_UX_V1.route}`;
}

export function isEmailConfirmationOtpType(type: string | null | undefined): boolean {
  if (!type) return false;
  return (
    type === "signup" ||
    type === "email" ||
    type === "invite" ||
    type === "email_change"
  );
}
