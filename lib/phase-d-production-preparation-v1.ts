/**
 * ROVEXO Phase D — Production Preparation & Launch Certification (v1.0).
 *
 * STATUS: ACTIVE · ENGINEERING CERTIFICATION · OWNER APPROVAL REQUIRED FOR PUSH/DEPLOY/LOCK
 *
 * Scope: production readiness only. No new marketplace features. No UI redesign.
 * GitHub Push · Vercel Production Deploy · Production LOCK are forbidden until Owner approval.
 */

export const PHASE_D_PRODUCTION_PREPARATION_V1 = {
  id: "phase-d-production-preparation-v1",
  version: "1.0.0",
  status: "ACTIVE",
  ownerApprovalRequiredFor: ["GITHUB_PUSH", "VERCEL_PRODUCTION_DEPLOY", "PRODUCTION_LOCK"] as const,

  dataReset: {
    keep: [
      "users",
      "authentication",
      "passwords",
      "sessions",
      "settings",
      "verification_state",
      "preferences",
      "legal_acceptance_history",
      "full_demo_accounts",
    ] as const,
    remove: [
      "qa_demo_listings",
      "test_drafts",
      "test_favourites",
      "test_messages",
      "test_conversations",
      "test_offers",
      "test_orders",
      "test_shipping_labels",
      "test_wallet_history",
      "test_notifications",
      "test_reviews",
      "test_reports",
      "demo_session_artifacts",
    ] as const,
    script: "scripts/phase-d-qa-data-reset.ts",
    npm: "phase-d:qa-reset",
    neverDeleteRealUsers: true,
    neverWipeProductionHostWithoutOverride: true,
  },

  surfaces: {
    auth: ["/login", "/register", "/auth/callback"],
    profile: ["/account", "/account/profile", "/user"],
    wallet: ["/wallet", "/balance"],
    browseSearch: ["/", "/search"],
    sell: ["/sell"],
    messages: ["/inbox"],
    orders: ["/orders"],
    checkout: ["/checkout"],
    notifications: ["/inbox"],
    holidayMode: ["/account"],
    hmrc: ["/seller/compliance", "/seller/tax", "/legal/digital-platform-reporting-tax-notice"],
    legal: ["/legal"],
    help: ["/help", "/help/policies"],
    settings: ["/account/settings"],
    verification: ["/account/verification", "/trust"],
  },

  pwa: {
    manifest: "app/manifest.ts",
    serviceWorker: "public/sw.js",
    offline: "/offline",
    provider: "components/pwa/PwaProvider.tsx",
    iconsGlob: "public/icons/icon-*.png",
    maskable: "public/icons/icon-maskable-512.png",
    appleTouch: "public/apple-icon.png",
  },

  push: {
    vapid: "lib/push/vapid.ts",
    service: "lib/push/service.ts",
    subscribeApi: "app/api/push/subscribe/route.ts",
    client: "lib/push/client-subscribe.ts",
    swHandler: "public/sw.js",
  },

  hmrc: {
    dashboard: "features/seller/compliance/ComplianceDashboard.tsx",
    engine: "lib/compliance/hmrc-engine-v1.ts",
    reporting: "lib/compliance/hmrc-documents-v1.ts",
    eligibility: "lib/compliance/hmrc-eligibility-v1.ts",
    snapshot: "lib/compliance/hmrc-seller-snapshot.server.ts",
    taxProfile: "features/seller/tax/components/SellerTaxRegistrationPage.tsx",
    /** Legacy wallet-statement CSV helpers — not the live Reporting Centre path. */
    legacyWalletCsv: "lib/compliance/digital-platform-reporting.ts",
    legalSlug: "digital-platform-reporting-tax-notice",
  },

  email: {
    service: "lib/email/service.ts",
    constants: "lib/email/constants.ts",
    outbox: "email_outbox",
  },

  seo: {
    sitemap: "app/sitemap.ts",
    robots: "app/robots.ts",
    metadata: "lib/seo/metadata.ts",
    ogImage: "public/brand/og-image.png",
  },

  security: {
    headers: "lib/ops/security-headers.ts",
    productionEnv: "lib/ops/production-env.ts",
    verifyEnv: "scripts/verify-env.ts",
  },

  /**
   * P10.6R — remaining Owner-facing blockers (Apple/Facebook deferred · not listed).
   * Google ops configured; live Owner confirmation still required for PRODUCTION_READY.
   */
  externalBlockers: [
    {
      id: "GOOGLE_OAUTH_LIVE_CONFIRMATION",
      areas: ["GOOGLE_LOGIN"],
      remediation:
        "Owner live Google login confirmation on localhost:3000 and/or https://www.rovexo.co.uk (ops already configured)",
      ssot: "lib/rovexo-production-certification-v1.ts",
      roadmapNote: "Apple/Facebook DEFERRED_V2_NOT_BLOCKING",
    },
  ] as const,
} as const;

export type PhaseDProductionPreparationV1 = typeof PHASE_D_PRODUCTION_PREPARATION_V1;

export function phaseDExternalBlockersOpen(): boolean {
  return PHASE_D_PRODUCTION_PREPARATION_V1.externalBlockers.length > 0;
}
