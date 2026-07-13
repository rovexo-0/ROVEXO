/** AUTH_MASTER_SPEC v1.0 — Single source of truth for ROVEXO Auth module */

export const AUTH_MASTER_SPEC_VERSION = "v1.0" as const;

export const AUTH_MASTER_SPEC = {
  version: AUTH_MASTER_SPEC_VERSION,
  mobileReference: {
    device: "iPhone 17 Pro Max",
    viewportWidthPx: 430,
    maxContentWidthPx: 430,
    minTouchTargetPx: 48,
    primaryButtonHeightPx: 52,
    inputFontSizePx: 17,
  },
  routes: {
    splash: "/splash",
    welcome: "/welcome",
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    verifyEmail: "/verify-email",
    resetPassword: "/reset-password",
    home: "/",
  },
  splash: {
    /** Ordered bootstrap phases — must execute in sequence. */
    phases: ["initialize_app", "initialize_supabase", "restore_session"] as const,
    motion: "fade_only" as const,
    minDisplayMs: 800,
    fadeDurationMs: 600,
    maxWaitMs: 4000,
    /** No scale, bounce, or spinner on splash. */
    prohibitedMotion: ["scale", "bounce", "spinner"] as const,
    destinations: {
      authenticatedVerified: "/",
      authenticatedUnverified: "/verify-email",
      guest: "/welcome",
    },
    copy: {
      wordmark: "ROVEXO",
      tagline: "Buy. Sell. Grow.",
      ariaLabel: "Loading ROVEXO",
    },
    assets: {
      mark: "RovexoAppIconMark",
      markSizePx: 96,
    },
    presentation: {
      layout: "full_bleed",
      shell: "none",
      background:
        "linear-gradient(180deg, #f5f0ff 0%, #faf8ff 42%, #ffffff 100%)",
      noWhiteScreen: true,
    },
  },
  welcome: {
    fadeDurationMs: 225,
    motion: "fade_only" as const,
    prohibitedMotion: ["scale", "bounce", "rotation"] as const,
    presentation: {
      layout: "centered",
      background: "#ffffff",
      maxWidthPx: 430,
    },
    routes: {
      signIn: "/login",
      register: "/register",
      terms: "/legal/terms-and-conditions",
      privacy: "/legal/privacy-policy",
    },
    socialProviders: ["apple", "google", "facebook"] as const,
    copy: {
      tagline: "BUY. SELL. GROW.",
      title: "Welcome to ROVEXO",
      description:
        "Discover trusted buying and selling in one place. Sign in or create your free account to get started.",
      signIn: "Sign In",
      createAccount: "Create Account",
      divider: "or continue with",
      footerPrefix: "By continuing you agree to the",
      termsLabel: "Terms of Service",
      privacyLabel: "Privacy Policy",
      socialLabels: {
        apple: "Continue with Apple",
        google: "Continue with Google",
        facebook: "Continue with Facebook",
      },
    },
  },
} as const;

export type AuthSplashPhase = (typeof AUTH_MASTER_SPEC.splash.phases)[number];
export type AuthWelcomeSocialProvider = (typeof AUTH_MASTER_SPEC.welcome.socialProviders)[number];
