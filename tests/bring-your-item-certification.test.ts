import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BRING_YOUR_ITEM_PLATFORM_FLOWS,
  isPlatformImportReady,
  parseBringYourItemWizardQuery,
  resolveDefaultImportMethod,
  resolveImportErrorRecovery,
  resolveOAuthWizardError,
} from "@/lib/bring-your-item";
import { runBringYourItemCertification } from "@/lib/bring-your-item/certification";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { MIGRATION_WIZARD_STEPS } from "@/lib/seller/migration/constants";
import { IMPORT_WIZARD_PATH, LEGACY_MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { OAUTH_PLATFORM_IDS } from "@/lib/seller/marketplace/oauth/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Bring Your Item — Phase 1 UX certification", () => {
  it("uses a 3-step wizard without preview or duplicate confirm labels", () => {
    expect(MIGRATION_WIZARD_STEPS).toHaveLength(3);
    expect(MIGRATION_WIZARD_STEPS.map((step) => step.label)).toEqual([
      "Marketplace",
      "Connect",
      "Import",
    ]);

    const center = readSource("features/seller/migration/components/MigrationCenterPage.tsx");
    expect(center).toContain("MigrationConnectStep");
    expect(center).toContain("MigrationImportStep");
    expect(center).not.toContain("MigrationPreviewStep");
    expect(center).not.toContain("MigrationImportMethodStep");
    expect(center).not.toContain("Prepare migration");
    expect(center).not.toContain("Run migration");
    expect(center).toContain("Import");
    const connect = readSource("features/seller/migration/components/steps/MigrationConnectStep.tsx");
    expect(connect).toContain("MigrationInlinePreviewPanel");
  });

  it("chains job creation and engine start in the wizard hook", () => {
    const hook = readSource("features/seller/migration/hooks/use-migration-wizard.ts");
    expect(hook).toContain("startImport");
    expect(hook).toContain("start: true");
    expect(hook).toContain("useInlineImportPreview");
    expect(hook).toContain("resumeJob");
    expect(hook).not.toContain("buildPreviewItems");
    expect(hook).toContain("cancelImport");
    expect(hook).toContain("retryImport");
  });

  it("supports server-side import cancellation", () => {
    const route = readSource("app/api/seller/migration/[id]/route.ts");
    expect(route).toContain('action === "cancel"');
    expect(route).toContain("markImportCancelled");
  });

  it("keeps job detail on the inline import route", () => {
    const jobPage = readSource("app/import/[id]/page.tsx");
    expect(jobPage).toContain("?job=");
    expect(jobPage).not.toContain("MigrationJobDetailPage");
  });

  it("auto-starts import after OAuth return and supports resume query", () => {
    const center = readSource("features/seller/migration/components/MigrationCenterPage.tsx");
    expect(center).toContain("oauthConnected");
    expect(center).toContain("resumeJobId");
    expect(center).toContain("startImport");

    const query = parseBringYourItemWizardQuery(
      new URLSearchParams("platform=ebay&connected=1&job=abc-123"),
    );
    expect(query.initialPlatform).toBe("ebay");
    expect(query.oauthConnected).toBe(true);
    expect(query.resumeJobId).toBe("abc-123");
  });

  it("auto-selects import methods from platform flow SSOT", () => {
    expect(resolveDefaultImportMethod("ebay")).toBe("api_import");
    expect(resolveDefaultImportMethod("csv")).toBe("csv");
    expect(BRING_YOUR_ITEM_PLATFORM_FLOWS.length).toBeGreaterThanOrEqual(7);
  });

  it("loads dedicated Bring Your Item styles", () => {
    const styles = readSource("styles/rovexo/index.css");
    expect(styles).toContain("bring-your-item.css");
  });
});

describe("Bring Your Item — Phase 2 inline connect certification", () => {
  it("does not send users to marketplace connectors from the primary wizard", () => {
    const center = readSource("features/seller/migration/components/MigrationCenterPage.tsx");
    const sourceFields = readSource("features/seller/migration/components/MigrationSourceFields.tsx");
    expect(center).toContain("useMarketplaceConnectors");
    expect(center).toContain("handleConnectOAuth");
    expect(sourceFields).not.toContain("Marketplace Connectors");
  });

  it("removes secondary connectors link from seller dashboard card", () => {
    const card = readSource("features/seller/migration/components/BringYourItemsDashboardCard.tsx");
    expect(card).not.toContain("MARKETPLACE_CONNECTORS_PATH");
    expect(card).toContain("Bring your item");
  });
});

describe("Bring Your Item — Phase 3 OAuth certification", () => {
  it("defines dynamic server-side OAuth routes for supported platforms", () => {
    const authorizeRoute = readSource("app/api/seller/marketplace/oauth/[platform]/authorize/route.ts");
    const callbackRoute = readSource("app/api/seller/marketplace/oauth/[platform]/callback/route.ts");
    const statusRoute = readSource("app/api/seller/marketplace/oauth/status/route.ts");

    expect(authorizeRoute).toContain("buildOAuthAuthorizeResponse");
    expect(authorizeRoute).toContain("isOAuthPlatform");
    expect(callbackRoute).toContain("handleOAuthCallback");
    expect(callbackRoute).toContain("isOAuthPlatform");
    expect(statusRoute).toContain("getOAuthConnectionsStatus");
    expect(OAUTH_PLATFORM_IDS).toEqual(["ebay", "etsy", "shopify"]);
  });

  it("keeps OAuth token exchange server-only without client secret exposure", () => {
    const service = readSource("lib/seller/marketplace/oauth/service.ts");
    const env = readSource("lib/seller/marketplace/oauth/env.ts");
    const tokenManager = readSource("lib/seller/marketplace/oauth/token-manager.ts");
    expect(service).toContain('"server-only"');
    expect(env).toContain('"server-only"');
    expect(tokenManager).toContain('"server-only"');
    expect(service).toContain("connectMarketplaceCredentials");
    expect(service).not.toContain("NEXT_PUBLIC_");
    expect(service).toContain("readEtsyApiKeystring");
    expect(service).toContain("expiresAt: tokens.expiresAt");

    const connectStep = readSource("features/seller/migration/components/steps/MigrationConnectStep.tsx");
    expect(connectStep).not.toContain("accessToken");
    expect(connectStep).toContain("Connect with");
    expect(connectStep).toContain("Shopify store domain");
  });

  it("supports token refresh, Shopify shop param, and production credential encryption", () => {
    const tokenManager = readSource("lib/seller/marketplace/oauth/token-manager.ts");
    const credentials = readSource("lib/seller/migration/connectors/credentials.ts");
    const connectorsRoute = readSource("app/api/seller/marketplace/connectors/[platform]/route.ts");
    const center = readSource("features/seller/migration/components/MigrationCenterPage.tsx");
    const envExample = readSource(".env.example");

    expect(tokenManager).toContain("refreshOAuthTokens");
    expect(tokenManager).toContain("loadConnectorCredentialsWithRefresh");
    expect(credentials).toContain("assertConnectorCredentialsSecret");
    expect(credentials).toContain("expiresAt?: string");
    expect(connectorsRoute).toContain('"refresh_token"');
    expect(center).toContain('params.set("shop"');
    expect(envExample).toContain("CONNECTOR_CREDENTIALS_SECRET");
  });
});

describe("Bring Your Item — Phase 4 SSOT certification", () => {
  it("uses /account/bring-your-item as the canonical entry and redirects legacy seller migration routes", () => {
    expect(BRING_YOUR_ITEM_PATH).toBe(IMPORT_WIZARD_PATH);
    expect(IMPORT_WIZARD_PATH).toBe("/account/bring-your-item");

    const legacyPage = readSource("app/seller/migration/page.tsx");
    const legacyJob = readSource("app/import/[id]/page.tsx");
    expect(legacyPage).toContain(`redirect(MIGRATION_CENTER_PATH)`);
    expect(legacyJob).toContain("BRING_YOUR_ITEM_PATH");
    expect(LEGACY_MIGRATION_CENTER_PATH).toBe("/seller/migration");
  });

  it("routes job detail links through inline /account/bring-your-item?job=", () => {
    const history = readSource("features/seller/migration/components/SellerMigrationHistorySection.tsx");
    expect(history).toContain("MIGRATION_CENTER_PATH");
    expect(history).toContain("?job=");
    expect(history).not.toContain('href={`/seller/migration/');
  });

  it("validates platform readiness rules", () => {
    expect(isPlatformImportReady("ebay", { connected: true, hasSourceInput: false })).toBe(true);
    expect(isPlatformImportReady("ebay", { connected: false, hasSourceInput: false })).toBe(false);
    expect(
      isPlatformImportReady("facebook_marketplace", {
        connected: false,
        hasSourceInput: true,
      }),
    ).toBe(true);
  });
});

describe("Bring Your Item — error recovery", () => {
  it("maps network and auth failures to actionable recovery copy", () => {
    const network = resolveImportErrorRecovery("Network request failed");
    expect(network.title).toBe("Network failure");
    expect(network.canRetry).toBe(true);

    const oauth = resolveOAuthWizardError({ oauthFailed: true, oauthUnconfigured: false, shopRequired: false });
    expect(oauth).toContain("connection failed");
  });
});

describe("Bring Your Item — full module wiring", () => {
  it("keeps legacy header CTA file but consumer routes redirect to Selling", () => {
    const cta = readSource("components/header/HeaderBringYourItemCta.tsx");
    const byi = readSource("app/account/bring-your-item/page.tsx");
    expect(cta).toContain("BRING_YOUR_ITEM_PATH");
    expect(byi).toContain('redirect("/seller")');
  });
});

describe("Bring Your Item — Official Certification Phase", () => {
  const report = runBringYourItemCertification();

  it("runs all 16 certification steps", () => {
    expect(report.steps).toHaveLength(16);
    expect(report.milestone).toBe("BRING YOUR ITEM CERTIFICATION");
    expect(report.engineeringStatus).toBe("FROZEN");
    expect(report.architecture).toBe("LOCKED");
    expect(report.version).toBe("1.0.0");
  });

  it("achieves ≥95% score with zero critical blockers", () => {
    expect(report.score).toBeGreaterThanOrEqual(95);
    const criticalBlockers = report.blockers.filter((b) => !b.includes("Live keys configured"));
    expect(criticalBlockers).toEqual([]);
    expect(report.pass).toBe(true);
  });

  it("passes STEP 1 — Open Bring Your Item", () => {
    const step = report.steps.find((s) => s.id === "step-1-open");
    expect(step?.pass).toBe(true);
    expect(step?.checks.every((c) => c.pass)).toBe(true);
  });

  it("passes STEP 2 — Authentication", () => {
    expect(report.steps.find((s) => s.id === "step-2-auth")?.pass).toBe(true);
  });

  it("passes STEP 3 — Wizard Navigation", () => {
    expect(report.steps.find((s) => s.id === "step-3-wizard")?.pass).toBe(true);
  });

  it("passes STEP 4 — Category Selection", () => {
    expect(report.steps.find((s) => s.id === "step-4-category")?.pass).toBe(true);
  });

  it("passes STEP 5 — Listing Details", () => {
    expect(report.steps.find((s) => s.id === "step-5-details")?.pass).toBe(true);
  });

  it("passes STEP 6 — Media Upload", () => {
    expect(report.steps.find((s) => s.id === "step-6-media")?.pass).toBe(true);
  });

  it("passes STEP 7 — Location", () => {
    expect(report.steps.find((s) => s.id === "step-7-location")?.pass).toBe(true);
  });

  it("passes STEP 8 — Shipping", () => {
    expect(report.steps.find((s) => s.id === "step-8-shipping")?.pass).toBe(true);
  });

  it("passes Sendcloud integration wiring (live keys optional at CI)", () => {
    const sendcloud = report.steps.find((s) => s.id === "sendcloud");
    expect(sendcloud).toBeDefined();
    const wiringChecks = sendcloud!.checks.filter((c) => c.id !== "live-token");
    expect(wiringChecks.every((c) => c.pass)).toBe(true);
  });

  it("passes Publishing, Buyer, Seller, Responsive, Performance, Security", () => {
    for (const id of ["publishing", "buyer", "seller", "responsive", "performance", "security"] as const) {
      expect(report.steps.find((s) => s.id === id)?.pass).toBe(true);
    }
  });

  it("passes Final Certification Gate", () => {
    expect(report.steps.find((s) => s.id === "final")?.pass).toBe(true);
  });

  it("defines next release phases", () => {
    expect(report.nextPhase).toContain("Sendcloud Production Certification");
    expect(report.nextPhase).toContain("Official Public Launch");
  });
});
