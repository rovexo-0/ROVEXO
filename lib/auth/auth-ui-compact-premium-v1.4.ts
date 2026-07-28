/**
 * ROVEXO AUTH UI COMPACT PREMIUM v1.4
 * OWNER APPROVED · LOCKED · FROZEN · SSOT
 *
 * Return to Compact Premium Sign In; keep successful improvements.
 * Create Account = centered text link (NOT a large secondary button).
 * Email + Password ONLY.
 */

export const AUTH_UI_COMPACT_PREMIUM_V1_4 = {
  version: "1.4",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  emailPasswordOnly: true,

  loginOrder: [
    "ROVEXO Logo",
    "BUY. SELL. GROW.",
    "Welcome Back",
    "Good to see you again.",
    "Email Address",
    "Password",
    "Remember Me / Forgot Password?",
    "Sign In",
    "SECURE SIGN IN / Your data is protected.",
    "New to ROVEXO? Create Account",
  ] as const,

  createAccount: {
    style: "centered_text_link",
    largeButtonForbidden: true,
    fontWeight: 600,
    fontSizePx: "15-16",
    color: "premium_purple",
  } as const,

  keep: {
    secureSignIn: true,
    signInButtonUnchanged: true,
    platformPurpleTheme: true,
    contextualValidationOnly: true,
    noOauthUi: true,
    noGdprCheckbox: true,
  } as const,

  ssot: {
    freeze: "lib/auth/auth-ui-compact-premium-v1.4.ts",
    login: "features/auth/components/LoginScreen.tsx",
    register: "features/auth/components/RegisterScreen.tsx",
    css: "styles/rovexo/auth-v1.css",
  } as const,
} as const;

export type AuthUiCompactPremiumV14 = typeof AUTH_UI_COMPACT_PREMIUM_V1_4;
