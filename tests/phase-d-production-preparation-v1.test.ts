import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PHASE_D_PRODUCTION_PREPARATION_V1,
  phaseDExternalBlockersOpen,
} from "@/lib/phase-d-production-preparation-v1";
import { ROVEXO_PRODUCTION_CERTIFICATION_V1 } from "@/lib/rovexo-production-certification-v1";
import { listLegalDocuments, getLegalDocument } from "@/lib/legal/canonical-documents";
import { HELP_CENTRE_CATEGORY_BUTTONS } from "@/lib/help/help-centre-categories";
import { listHelpPolicies } from "@/lib/help/policies";
import { CANONICAL_RX_PWA_SIZES } from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function exists(relativePath: string): boolean {
  return existsSync(join(process.cwd(), relativePath));
}

describe("Phase D — Production Preparation & Launch Certification", () => {
  it("locks Phase D SSOT and Owner push/deploy/lock gate", () => {
    expect(PHASE_D_PRODUCTION_PREPARATION_V1.status).toBe("ACTIVE");
    expect(PHASE_D_PRODUCTION_PREPARATION_V1.ownerApprovalRequiredFor).toContain("GITHUB_PUSH");
    expect(PHASE_D_PRODUCTION_PREPARATION_V1.ownerApprovalRequiredFor).toContain(
      "VERCEL_PRODUCTION_DEPLOY",
    );
    expect(PHASE_D_PRODUCTION_PREPARATION_V1.ownerApprovalRequiredFor).toContain("PRODUCTION_LOCK");
    expect(PHASE_D_PRODUCTION_PREPARATION_V1.dataReset.neverDeleteRealUsers).toBe(true);
    expect(exists("scripts/phase-d-qa-data-reset.ts")).toBe(true);
    expect(readSource("package.json")).toContain("phase-d:qa-reset");
  });

  it("certifies PWA manifest · icons · SW · offline · install provider", () => {
    const manifest = readSource("app/manifest.ts");
    expect(manifest).toContain('name: "ROVEXO"');
    expect(manifest).toContain('short_name: "ROVEXO"');
    expect(manifest).toContain('display: "standalone"');
    expect(manifest).toContain('start_url: "/"');
    expect(manifest).toContain('scope: "/"');
    expect(manifest).toContain("icon-maskable-512.png");
    expect(manifest).toContain('url: "/inbox"');
    expect(manifest).not.toContain('url: "/messages"');

    for (const size of CANONICAL_RX_PWA_SIZES) {
      expect(exists(`public/icons/icon-${size}.png`)).toBe(true);
    }
    expect(exists("public/icons/icon-maskable-512.png")).toBe(true);
    expect(exists("public/apple-icon.png")).toBe(true);
    expect(exists("app/apple-icon.png")).toBe(true);
    expect(exists("public/sw.js")).toBe(true);
    expect(readSource("public/sw.js")).toContain("rovexo-static-v15");
    expect(readSource("public/sw.js")).toContain("/offline");
    expect(readSource("public/sw.js")).toContain("push");
    expect(exists("app/offline/page.tsx")).toBe(true);
    expect(exists("components/pwa/PwaProvider.tsx")).toBe(true);
    expect(readSource("components/pwa/PwaProvider.tsx")).toContain("beforeinstallprompt");
    expect(readSource("components/pwa/PwaProvider.tsx")).toContain("/sw.js");
  });

  it("certifies push subscription · VAPID · SW delivery · types", () => {
    expect(exists("lib/push/vapid.ts")).toBe(true);
    expect(exists("lib/push/service.ts")).toBe(true);
    expect(exists("lib/push/client-subscribe.ts")).toBe(true);
    expect(exists("app/api/push/subscribe/route.ts")).toBe(true);
    expect(readSource("lib/push/service.ts")).toContain("push_subscriptions");
    expect(readSource("lib/push/service.ts")).toContain("sendPushNotification");
    expect(readSource("app/api/push/subscribe/route.ts")).toContain("POST");
    expect(readSource("public/sw.js")).toContain("notificationclick");
    const types = readSource("lib/notifications/types.ts");
    expect(types).toMatch(/message|offer|order|review|payment/i);
  });

  it("certifies HMRC / compliance / tax / legal notice alignment", () => {
    expect(exists("features/seller/compliance/ComplianceDashboard.tsx")).toBe(true);
    expect(exists("lib/compliance/hmrc-engine-v1.ts")).toBe(true);
    expect(exists("lib/compliance/hmrc-documents-v1.ts")).toBe(true);
    expect(exists("lib/compliance/hmrc-eligibility-v1.ts")).toBe(true);
    expect(exists("lib/compliance/digital-platform-reporting.ts")).toBe(true);
    expect(exists("features/seller/tax/components/SellerTaxRegistrationPage.tsx")).toBe(true);
    expect(PHASE_D_PRODUCTION_PREPARATION_V1.hmrc.reporting).toBe(
      "lib/compliance/hmrc-documents-v1.ts",
    );
    expect(PHASE_D_PRODUCTION_PREPARATION_V1.hmrc.engine).toBe(
      "lib/compliance/hmrc-engine-v1.ts",
    );
    expect(getLegalDocument("digital-platform-reporting-tax-notice")).toBeTruthy();
    expect(getLegalDocument("digital-platform-reporting-tax-notice")?.content).toMatch(/HMRC|tax/i);
    expect(readSource("features/seller/compliance/ComplianceDashboard.tsx")).toContain("HMRC");
    expect(readSource("features/seller/compliance/ComplianceDashboard.tsx")).toContain("Tax year");
    expect(readSource("lib/legal/canonical-documents.ts")).not.toContain("Business Seller Terms");
  });

  it("certifies Help Centre · policies SSOT · legal sync", () => {
    expect(HELP_CENTRE_CATEGORY_BUTTONS.length).toBeGreaterThanOrEqual(6);
    expect(listHelpPolicies().length).toBe(listLegalDocuments().length);
    expect(listHelpPolicies().every((p) => p.href.startsWith("/legal/"))).toBe(true);
    expect(exists("features/help/components/HelpCentrePage.tsx")).toBe(true);
    expect(exists("app/help/policies/page.tsx")).toBe(true);
  });

  it("certifies email service · official from · password reset queue", () => {
    const email = readSource("lib/email/service.ts");
    expect(email).toContain("RESEND_API_KEY");
    expect(email).toContain("email_outbox");
    expect(email).toContain("sendPasswordResetEmail");
    expect(readSource("lib/email/constants.ts")).toMatch(/rovexo\.co\.uk/i);
  });

  it("certifies SEO sitemap · robots · OG · metadata helpers", () => {
    expect(exists("app/sitemap.ts")).toBe(true);
    expect(exists("app/robots.ts")).toBe(true);
    expect(exists("lib/seo/metadata.ts")).toBe(true);
    expect(exists("public/brand/og-image.png")).toBe(true);
    expect(readSource("app/layout.tsx")).toMatch(/metadata|openGraph|twitter/i);
  });

  it("certifies security headers · production env · no debug rewrite of auth", () => {
    expect(exists("lib/ops/security-headers.ts")).toBe(true);
    expect(readSource("lib/ops/security-headers.ts")).toMatch(/Content-Security-Policy|CSP/i);
    expect(exists("lib/ops/production-env.ts")).toBe(true);
    expect(exists("scripts/verify-env.ts")).toBe(true);
    expect(readSource("next.config.ts")).toContain("securityHeaders");
  });

  it("certifies critical production flow surfaces exist", () => {
    const surfaces = PHASE_D_PRODUCTION_PREPARATION_V1.surfaces;
    expect(exists("app/(auth)/login/page.tsx") || exists("app/login/page.tsx")).toBe(true);
    expect(exists("app/account/page.tsx")).toBe(true);
    expect(exists("app/wallet/page.tsx") || exists("app/balance/page.tsx")).toBe(true);
    expect(exists("app/sell/page.tsx")).toBe(true);
    expect(exists("app/inbox/(list)/page.tsx") || exists("app/inbox/page.tsx")).toBe(true);
    expect(exists("app/orders/page.tsx")).toBe(true);
    expect(exists("app/checkout/page.tsx")).toBe(true);
    expect(exists("app/search/page.tsx")).toBe(true);
    expect(exists("app/legal/page.tsx")).toBe(true);
    expect(exists("app/help/page.tsx")).toBe(true);
    expect(surfaces.messages).toContain("/inbox");
    expect(surfaces.hmrc).toContain("/seller/compliance");
  });

  it("records OAuth configuration as open EXTERNAL BLOCKER (ops only)", () => {
    expect(phaseDExternalBlockersOpen()).toBe(true);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.EMAIL_LOGIN).toBe(true);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.GOOGLE_LOGIN).toBe(false);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.AUTH.APPLE_LOGIN).toBe(false);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.PRODUCTION_READY).toBe(false);
    expect(ROVEXO_PRODUCTION_CERTIFICATION_V1.CURRENT_STATUS.ROOT_CAUSE).toBe(
      "SUPABASE_OAUTH_CONFIGURATION",
    );
    expect(PHASE_D_PRODUCTION_PREPARATION_V1.externalBlockers[0]?.id).toBe(
      "SUPABASE_OAUTH_CONFIGURATION",
    );
  });

  it("qa reset script keeps users and Full Demo accounts", () => {
    const script = readSource("scripts/phase-d-qa-data-reset.ts");
    expect(script).toContain("ALL_USERS_KEPT");
    expect(script).toContain("demo.buyer@rovexo.co.uk");
    expect(script).toContain("demo.seller@rovexo.co.uk");
    expect(script).not.toContain("deleteUser");
    expect(script).toContain("DRY_RUN");
  });
});
