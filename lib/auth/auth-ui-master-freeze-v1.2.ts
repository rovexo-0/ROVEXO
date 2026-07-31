/**
 * ROVEXO AUTH UI MASTER FREEZE v1.2 (+ RC1 OAuth amendment)
 * OWNER APPROVED · LOCKED · FROZEN · SSOT
 *
 * Sign In + Register presentation only.
 * Email auth / session / Supabase / middleware UNCHANGED.
 * UK GDPR checkbox REMOVED permanently.
 *
 * OAuth RC1 (Owner authorized): Google / Apple buttons may appear only when
 * `loadPublicOauthProviders()` confirms the provider is enabled. Facebook stays hidden.
 * Never hardcode always-visible OAuth buttons.
 */

export const AUTH_UI_MASTER_FREEZE_V1_2 = {
  version: "1.2",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  oauthRc1Amendment: "GATED_GOOGLE_APPLE_WHEN_ENABLED",

  scope: ["login", "register"] as const,

  removedFromUi: [
    "Always-visible OAuth without availability gate",
    "Continue with Facebook",
    "All Facebook OAuth UI on Sign In / Register",
    "UK GDPR checkbox",
    "UK GDPR text",
  ] as const,

  keepLogin: [
    "ROVEXO Logo",
    "Welcome Back",
    "Good to see you again.",
    "Email Address",
    "Password",
    "Remember Me",
    "Forgot Password",
    "Sign In button",
    "Protected Sign-In",
    "Create Account link",
  ] as const,

  keepRegister: [
    "Back button",
    "RX Logo",
    "BUY • SELL • GROW",
    "Full Name",
    "Email Address",
    "Password",
    "Confirm Password",
    "Terms and Conditions",
    "Optional marketing consent",
    "Create Free Account button",
    "Secure Registration",
    "Sign In link",
  ] as const,

  removedFromRegisterForever: [
    "Join ROVEXO Today",
  ] as const,

  doNotModify: [
    "Email Login logic",
    "Email Register logic",
    "Remember Me",
    "Forgot Password",
    "Cookie Sessions",
    "Session Restore",
    "Supabase Auth",
    "Middleware",
    "Routes",
    "Search",
    "Header",
    "Camera Search",
  ] as const,

  theme: {
    platformPurpleGradient: true,
    compactPremium: true,
    mobileFirst: true,
    fullWidth: true,
    mustFeelPartOfRovexo: true,
  } as const,

  ssot: {
    freeze: "lib/auth/auth-ui-master-freeze-v1.2.ts",
    login: "features/auth/components/LoginScreen.tsx",
    register: "features/auth/components/RegisterScreen.tsx",
    css: "styles/rovexo/auth-v1.css",
  } as const,
} as const;

export type AuthUiMasterFreezeV12 = typeof AUTH_UI_MASTER_FREEZE_V1_2;
