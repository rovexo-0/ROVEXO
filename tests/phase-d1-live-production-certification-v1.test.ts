import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1,
  phaseD1GoNoGo,
  phaseD1HasOpenOwnerGates,
} from "@/lib/phase-d1-live-production-certification-v1";
import { CLUSTER_6_OAUTH_POLICY_LOCK_V1 } from "@/lib/auth/cluster-6-oauth-policy-lock-v1";
import { LEGAL_DOCUMENT_SLUGS } from "@/lib/legal/canonical-documents";
import { OWNER_PREVIEW_ORIGIN } from "@/lib/preview/owner-preview-ssot";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Phase D.1 — Live Production Certification (Final Gate)", () => {
  it("locks official live origin and forbids push/deploy/lock without Owner", () => {
    expect(PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1.officialOrigin).toBe(OWNER_PREVIEW_ORIGIN);
    expect(PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1.officialOrigin).toBe(
      "https://www.rovexo.co.uk",
    );
    expect(PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1.forbiddenUntilOwnerApproval).toEqual([
      "GITHUB_PUSH",
      "VERCEL_PRODUCTION_DEPLOY",
      "PRODUCTION_LOCK",
    ]);
    expect(phaseD1HasOpenOwnerGates()).toBe(true);
    expect(phaseD1GoNoGo()).toBe("NO-GO");
  });

  it("records live HTTP probe evidence for security · PWA assets · legal · auth policy", () => {
    const probe = PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1.liveProbe;
    expect(probe.https).toBe("PASS");
    expect(probe.securityHeaders.csp).toBe("PASS");
    expect(probe.securityHeaders.hsts).toBe("PASS");
    expect(probe.robotsTxt).toBe("PASS");
    expect(probe.manifest).toBe("PASS");
    expect(probe.serviceWorker).toBe("PASS");
    expect(probe.offlinePage).toBe("PASS");
    expect(probe.pwaIcons).toBe("PASS");
    expect(probe.legalIndex).toBe("PASS");
    expect(probe.loginEmailUi).toBe("PASS");
    expect(probe.loginOauthButtonsPublic).toBe("GATED_BY_AVAILABILITY");
    expect(probe.sitemapChildren).toBe("PASS");
  });

  it("certifies Cluster 6 RC1 gated Google/Apple · Facebook deferred", () => {
    expect(CLUSTER_6_OAUTH_POLICY_LOCK_V1.publicV1Methods.email).toBe("ENABLED");
    expect(CLUSTER_6_OAUTH_POLICY_LOCK_V1.codeReadyUiGated.google.publicLoginRegisterUi).toBe(
      "GATED_BY_AVAILABILITY",
    );
    expect(CLUSTER_6_OAUTH_POLICY_LOCK_V1.codeReadyUiGated.apple.publicLoginRegisterUi).toBe(
      "GATED_BY_AVAILABILITY",
    );
    expect(CLUSTER_6_OAUTH_POLICY_LOCK_V1.deferredToV1_1).toContain("Facebook OAuth");
    expect(PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1.oauth.publicSocialButtons).toBe(
      "GATED_BY_AVAILABILITY",
    );
  });

  it("ships sitemap.xml index via API rewrite (avoids Next metadata route conflict)", () => {
    expect(existsSync(join(process.cwd(), "app/api/seo/sitemap-index/route.ts"))).toBe(true);
    const route = readSource("app/api/seo/sitemap-index/route.ts");
    expect(route).toContain("sitemapindex");
    expect(route).toContain('"static"');
    expect(route).toContain("/sitemap/${id}.xml");
    const config = readSource("next.config.ts");
    expect(config).toContain('source: "/sitemap.xml"');
    expect(config).toContain('destination: "/api/seo/sitemap-index"');
    expect(readSource("app/robots.ts")).toContain("/sitemap.xml");
    expect(readSource("app/robots.ts")).toContain("/sitemap/static.xml");
  });

  it("keeps legal SSOT without Business Seller Terms for post-deploy live align", () => {
    expect(LEGAL_DOCUMENT_SLUGS).not.toContain("business-seller-terms");
    expect(LEGAL_DOCUMENT_SLUGS.length).toBe(25);
    expect(readSource("next.config.ts")).toContain("/legal/business-seller-terms");
  });

  it("lists Owner device / push / email / visual gates as open", () => {
    const waiting = PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1.waitingForOwner;
    expect(waiting).toContain("REAL_DEVICE_PWA_INSTALL_IPHONE_SAFARI");
    expect(waiting).toContain("REAL_DEVICE_PUSH_PERMISSION_AND_DELIVERY");
    expect(waiting).toContain("OWNER_VISUAL_CERTIFICATION_MATRIX");
    expect(waiting).toContain("LIVE_EMAIL_SEND_MATRIX_AND_DNS_AUTH");
    expect(waiting).not.toContain("HMRC_AUTHENTICATED_LIVE_WALKTHROUGH");
    expect(PHASE_D1_LIVE_PRODUCTION_CERTIFICATION_V1.ownerCompleted).toContain(
      "HMRC_AUTHENTICATED_LIVE_WALKTHROUGH",
    );
  });
});
