/**
 * ROVEXO Phase D.1 — Live Production Certification (Final Gate).
 *
 * STATUS: ACTIVE · LIVE EVIDENCE REQUIRED · NO PUSH/DEPLOY/LOCK WITHOUT OWNER
 *
 * Certifies LIVE origin + external integrations. Does not deploy.
 * Official origin: https://www.rovexo.co.uk
 */

import { OWNER_PREVIEW_ORIGIN, PRODUCTION_ORIGIN } from "@/lib/preview/owner-preview-ssot";
import { CLUSTER_6_OAUTH_POLICY_LOCK_V1 } from "@/lib/auth/cluster-6-oauth-policy-lock-v1";
import { ROVEXO_PRODUCTION_CERTIFICATION_V1 } from "@/lib/rovexo-production-certification-v1";

export const PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1 = {
  id: "phase-d1-live-production-certification-v1",
  version: "1.0.0",
  status: "ACTIVE",
  officialOrigin: OWNER_PREVIEW_ORIGIN,
  productionOrigin: PRODUCTION_ORIGIN,
  forbiddenUntilOwnerApproval: [
    "GITHUB_PUSH",
    "VERCEL_PRODUCTION_DEPLOY",
    "PRODUCTION_LOCK",
  ] as const,

  /**
   * Live probe results captured during Phase D.1 (engineering HTTP evidence).
   * Device / Owner visual / real push / real email remain Owner gates.
   */
  liveProbe: {
    origin: "https://www.rovexo.co.uk",
    https: "PASS",
    securityHeaders: {
      csp: "PASS",
      hsts: "PASS",
      xFrameOptions: "PASS",
      referrerPolicy: "PASS",
      cooop: "PASS",
    },
    robotsTxt: "PASS",
    /** Live still 404; workspace fix = rewrite /sitemap.xml → /api/seo/sitemap-index. */
    sitemapXmlRoot: "FIXED_IN_WORKSPACE_PENDING_DEPLOY",
    sitemapChildren: "PASS",
    manifest: "PASS",
    serviceWorker: "PASS",
    offlinePage: "PASS",
    pwaIcons: "PASS",
    appleIcon: "PASS",
    favicon: "PASS",
    ogImage: "PASS",
    legalIndex: "PASS",
    legalDocumentPages: "PASS",
    loginEmailUi: "PASS",
    loginOauthButtonsPublic: "GATED_BY_AVAILABILITY",
    authCallbackRoute: "PASS",
    helpCentre: "PASS",
    helpPolicies: "PASS",
  } as const,

  oauth: {
    publicV1: CLUSTER_6_OAUTH_POLICY_LOCK_V1.publicV1Methods,
    googleApple: "PUBLIC_WHEN_PROVIDER_ENABLED",
    facebook: "DEFERRED_V1_1",
    /** Public Login/Register show Google/Apple only when availability probe PASSes. */
    publicSocialButtons: "GATED_BY_AVAILABILITY",
    supabaseProviderConfig: ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.ROOT_CAUSE,
    productionReadyFlag: ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.PRODUCTION_READY,
  } as const,

  waitingForOwner: [
    "REAL_DEVICE_PWA_INSTALL_IPHONE_SAFARI",
    "REAL_DEVICE_PWA_INSTALL_ANDROID_CHROME",
    "REAL_DEVICE_PWA_DESKTOP_CHROME_EDGE",
    "REAL_DEVICE_PUSH_PERMISSION_AND_DELIVERY",
    "REAL_DEVICE_PUSH_ALL_NOTIFICATION_FAMILIES",
    "OWNER_VISUAL_CERTIFICATION_MATRIX",
    "LIVE_EMAIL_SEND_MATRIX_AND_DNS_AUTH",
    "QA_DATA_RESET_APPLY_APPROVAL",
  ] as const,

  ownerCompleted: [
    "HMRC_AUTHENTICATED_LIVE_WALKTHROUGH",
  ] as const,

  engineeringFixesInScope: [
    "Add /api/seo/sitemap-index + next.config rewrite for /sitemap.xml",
    "Keep /sitemap.xml listed in robots.txt (index after deploy)",
  ] as const,
} as const;

export type PhaseD1LiveProductionCertificationV1 =
  typeof PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1;

export function phaseD1HasOpenOwnerGates(): boolean {
  return PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1.waitingForOwner.length > 0;
}

export function phaseD1GoNoGo(): "NO-GO" | "GO" {
  if (phaseD1HasOpenOwnerGates()) return "NO-GO";
  return "GO";
}
