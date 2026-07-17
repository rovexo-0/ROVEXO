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
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    verifyEmail: "/verify-email",
    resetPassword: "/reset-password",
    home: "/",
  },
  /**
   * Canonical startup (Product Owner private deployment contract):
   * Guest → Login · Valid session → Homepage · No Splash · No Welcome.
   */
  startup: {
    guestEntry: "/login",
    authenticatedHome: "/",
    authenticatedUnverified: "/verify-email",
    removedRoutes: ["/splash", "/welcome"] as const,
  },
  splash: {
    /** @deprecated Removed — kept only for type/test migration until Splash files deleted. */
    phases: ["initialize_app", "initialize_supabase", "restore_session"] as const,
    motion: "fade_only" as const,
    minDisplayMs: 0,
    fadeDurationMs: 0,
    maxWaitMs: 0,
    prohibitedMotion: ["scale", "bounce", "spinner"] as const,
    destinations: {
      authenticatedVerified: "/",
      authenticatedUnverified: "/verify-email",
      guest: "/login",
    },
    copy: {
      wordmark: "ROVEXO",
      tagline: "BUY . SELL . GROW.",
      ariaLabel: "Loading ROVEXO",
    },
    assets: {
      mark: "RovexoAppIconMark",
      markSizePx: 96,
    },
    presentation: {
      layout: "full_bleed",
      shell: "none",
      background: "#ffffff",
      noWhiteScreen: true,
    },
  },
  welcome: {
    /** @deprecated Removed — Welcome page deleted per Product Owner contract. */
    uiVersion: "removed" as const,
    fadeDurationMs: 0,
    motion: "none" as const,
    prohibitedMotion: ["bounce", "neon", "aggressive_glow"] as const,
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
      tagline: "BUY • SELL • GROW.",
      title: "The open marketplace for real value.",
      description:
        "Buy, sell, and grow across curated assets and opportunities.",
      signIn: "Sign In",
      createAccount: "Continue",
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
      /** No Welcome — Login is the guest entry. */
      back: null,
      register: "/register",
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
      back: "/login",
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
  forgotPassword: {
    fadeDurationMs: 225,
    motion: "fade_only" as const,
    prohibitedMotion: ["scale", "bounce", "rotation"] as const,
    presentation: {
      layout: "centered",
      background: "#ffffff",
      maxWidthPx: 430,
    },
    routes: {
      back: "/login",
      signIn: "/login",
      openEmail: "mailto:",
    },
    copy: {
      title: "Forgot your password?",
      description:
        "Enter your email address and we'll send you a secure password reset link.",
      emailLabel: "Email",
      emailPlaceholder: "name@email.co.uk",
      submit: "Send Reset Link",
      submitting: "Sending reset link…",
      backToSignIn: "Back to Sign In",
      successTitle: "Check your email",
      successDescription:
        "We've sent a password reset link to your email address.",
      openEmailApp: "Open Email App",
      offlineError: "You appear to be offline. Check your connection and try again.",
    },
  },
  resetPassword: {
    fadeDurationMs: 225,
    motion: "fade_only" as const,
    prohibitedMotion: ["scale", "bounce", "rotation"] as const,
    presentation: {
      layout: "centered",
      background: "#ffffff",
      maxWidthPx: 430,
    },
    routes: {
      back: "/login",
      signIn: "/login",
      forgotPassword: "/forgot-password",
    },
    copy: {
      title: "Reset your password",
      description: "Create a strong new password for your ROVEXO account.",
      newPasswordLabel: "New Password",
      newPasswordPlaceholder: "Enter your new password",
      confirmPasswordLabel: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm your new password",
      passwordHint: "At least 8 characters with upper, lower, number, and symbol",
      checklist: {
        minLength: "Minimum 8 characters",
        uppercase: "One uppercase letter",
        lowercase: "One lowercase letter",
        number: "One number",
        special: "One special character",
      },
      strengthLabels: {
        veryWeak: "Very Weak",
        weak: "Weak",
        medium: "Medium",
        strong: "Strong",
        excellent: "Excellent",
      },
      submit: "Reset Password",
      submitting: "Resetting password…",
      successTitle: "Password updated successfully",
      successDescription: "Your password has been changed. You can now sign in with your new credentials.",
      goToSignIn: "Go to Sign In",
      invalidTitle: "Invalid link",
      invalidDescription:
        "This password reset link is invalid. Request a new link and try again.",
      expiredTitle: "Your password reset link has expired.",
      expiredDescription: "Request a new link to choose a new password.",
      requestNewLink: "Request New Reset Link",
      errors: {
        weakPassword: "Password must meet all strength requirements.",
        passwordsMismatch: "Passwords do not match.",
        expiredToken: "Your password reset link has expired.",
        invalidToken: "This password reset link is invalid.",
        offline: "You appear to be offline. Check your connection and try again.",
        serverUnavailable:
          "We're unable to reset your password right now. Please try again shortly.",
        tooManyRequests: "Too many attempts. Please wait a moment and try again.",
        unknown: "Something went wrong. Please try again.",
      },
    },
  },
} as const;

export type AuthSplashPhase = (typeof AUTH_MASTER_SPEC.splash.phases)[number];
export type AuthWelcomeSocialProvider = (typeof AUTH_MASTER_SPEC.welcome.socialProviders)[number];
export type AuthSocialProvider = AuthWelcomeSocialProvider;
export type AuthLoginSocialProvider = (typeof AUTH_MASTER_SPEC.login.socialProviders)[number];
export type AuthRegisterSocialProvider = (typeof AUTH_MASTER_SPEC.register.socialProviders)[number];
