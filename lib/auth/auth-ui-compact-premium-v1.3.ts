/**
 * ROVEXO AUTH UI COMPACT PREMIUM v1.3
 * OWNER APPROVED · LOCKED · FROZEN · SSOT
 *
 * Sign In + Register UI polish only.
 * Email + Password ONLY. Auth logic / Supabase / middleware UNCHANGED.
 */

export const AUTH_UI_COMPACT_PREMIUM_V1_3 = {
  version: "1.3",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  emailPasswordOnly: true,

  login: {
    trustTitle: "SECURE SIGN IN",
    trustCopy: "Your data is protected.",
    createAccount: "Compact Premium secondary button",
  } as const,

  register: {
    marketing: "Receive ROVEXO news and offers (OPTIONAL)",
    trustTitle: "SECURE REGISTRATION",
    trustCopy: "Your account is protected.",
    noDefaultPasswordHint: true,
    contextualValidationOnly: true,
    approvedStack:
      "RX → BUY • SELL • GROW → fields → Terms → Optional marketing → Create Free Account → Secure Registration → Sign In",
  } as const,

  forbiddenUi: [
    "Google",
    "Apple",
    "Facebook",
    "OAuth UI",
    "UK GDPR",
    "At least 8 characters default hint",
  ] as const,

  ssot: {
    freeze: "lib/auth/auth-ui-compact-premium-v1.3.ts",
    login: "features/auth/components/LoginScreen.tsx",
    register: "features/auth/components/RegisterScreen.tsx",
    css: "styles/rovexo/auth-v1.css",
  } as const,
} as const;

export type AuthUiCompactPremiumV13 = typeof AUTH_UI_COMPACT_PREMIUM_V1_3;
