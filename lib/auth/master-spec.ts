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
  brandLogo: {
    component: "RovexoBrandLogo",
    path: "components/branding/RovexoBrandLogo.tsx",
    mobileWidthPx: 220,
    desktopWidthPx: 280,
    topSafeAreaPx: 48,
    titleGapPx: 32,
    prohibitedOnAuth: ["RovexoAppIconMark", "RovexoLogo", "favicon", "pwa"],
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
  login: {
    fadeDurationMs: 225,
    motion: "fade_only" as const,
    prohibitedMotion: ["scale", "bounce", "rotation"] as const,
    presentation: {
      layout: "centered",
      background: "#ffffff",
      maxWidthPx: 430,
    },
    routes: {
      back: "/welcome",
    },
    socialProviders: ["apple", "google", "facebook"] as const,
    copy: {
      tagline: "BUY. SELL. GROW.",
      title: "Welcome back 👋",
      description:
        "Great to see you again. Continue buying, selling and growing your ROVEXO journey.",
      emailLabel: "Email",
      emailPlaceholder: "name@email.co.uk",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      rememberMe: "Remember Me",
      forgotPassword: "Forgot Password",
      signIn: "Sign In",
      submitting: "Signing in…",
      divider: "or continue with",
      footerPrefix: "New to ROVEXO?",
      createAccount: "Create Free Account",
      socialLabels: {
        apple: "Continue with Apple",
        google: "Continue with Google",
        facebook: "Continue with Facebook",
      },
    },
  },
  register: {
    fadeDurationMs: 225,
    motion: "fade_only" as const,
    prohibitedMotion: ["scale", "bounce", "rotation"] as const,
    presentation: {
      layout: "centered",
      background: "#ffffff",
      maxWidthPx: 430,
    },
    routes: {
      back: "/welcome",
      signIn: "/login",
    },
    socialProviders: ["apple", "google", "facebook"] as const,
    copy: {
      tagline: "BUY. SELL. GROW.",
      title: "Join ROVEXO today 🚀",
      description:
        "Create your free account and start buying, selling and growing your business in minutes.",
      fullNameLabel: "Full Name",
      fullNamePlaceholder: "Your full name",
      emailLabel: "Email",
      emailPlaceholder: "name@email.co.uk",
      passwordLabel: "Password",
      passwordPlaceholder: "Create a password",
      confirmPasswordLabel: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm your password",
      passwordHint: "At least 8 characters",
      submit: "Create Free Account",
      submitting: "Creating account…",
      divider: "or continue with",
      footerPrefix: "Already have an account?",
      signIn: "Sign In",
      socialLabels: {
        apple: "Continue with Apple",
        google: "Continue with Google",
        facebook: "Continue with Facebook",
      },
      termsPrefix: "I agree to the",
      termsLabel: "Terms",
      privacyLabel: "Privacy Policy",
      cookieLabel: "Cookie Policy",
      gdpr:
        "I understand ROVEXO will process my personal data to provide the marketplace under UK GDPR.",
      marketing: "Receive updates and offers",
    },
  },
} as const;

export type AuthSplashPhase = (typeof AUTH_MASTER_SPEC.splash.phases)[number];
export type AuthWelcomeSocialProvider = (typeof AUTH_MASTER_SPEC.welcome.socialProviders)[number];
export type AuthSocialProvider = AuthWelcomeSocialProvider;
export type AuthLoginSocialProvider = (typeof AUTH_MASTER_SPEC.login.socialProviders)[number];
export type AuthRegisterSocialProvider = (typeof AUTH_MASTER_SPEC.register.socialProviders)[number];
