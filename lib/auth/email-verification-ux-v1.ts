/**
 * ROVEXO EMAIL VERIFICATION UX v1.0 (P0 · COD SÂNGE)
 *
 * Canonical branded verification flow — Supabase backend only (never hosted UI).
 * Route SSOT: `/verify-email`
 * Email HTML SSOT: `supabase/templates/confirmation.html`
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
    subject: "Welcome to ROVEXO — Confirm your email",
    heroTagline: "Buy • Sell • Grow",
    headline: "Your ROVEXO account is almost ready!",
    body: "Confirm your email address to activate your account and start buying, selling and discovering on ROVEXO.",
    accountLabel: "Your ROVEXO account",
    cta: "CONFIRM MY EMAIL",
    /** Neutral — do not claim a fixed TTL unless configured in Auth. */
    secureLinkNote: "This link is secure and will expire after a limited time.",
    trustSecureTitle: "Secure account verification",
    trustSecureBody: "Your security is our priority.",
    trustFastTitle: "One click to activate",
    trustFastBody: "Get started in seconds.",
    footerTagline: "Discover. Sell. Grow.",
    footerBrand: "ROVEXO — Buy • Sell • Grow",
    footerDomain: "rovexo.co.uk",
    ignoreNote: "If you didn’t create a ROVEXO account, you can safely ignore this email.",
    emblemPath: "/og/rovexo-email-logo.jpg",
    heroImagePath: "/og/rovexo-homepage-social-v2.jpg",
    /** Direct app link — never ConfirmationURL (avoids vendor hosted verify UI). */
    confirmPath: "/verify-email",
    contentPath: "supabase/templates/confirmation.html",
    /** Dynamic placeholders required in the HTML template. */
    requiredPlaceholders: ["{{ .SiteURL }}", "{{ .TokenHash }}", "{{ .Email }}"] as const,
  },
  forbidden: [
    "Powered by Supabase",
    "Supabase Auth",
    "supabase.co hosted verify UI",
    "Sendcloud",
    "SendCloud",
    "raw exceptions",
    "stack traces",
    "duplicate verification routes",
    "localhost",
    "127.0.0.1",
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

/** Build the branded confirmation href pattern used in the email HTML (TokenHash dynamic). */
export function buildEmailConfirmationHrefPattern(): string {
  return `${EMAIL_VERIFICATION_UX_V1.emailTemplate.confirmPath}?token_hash={{ .TokenHash }}&type=signup`;
}
