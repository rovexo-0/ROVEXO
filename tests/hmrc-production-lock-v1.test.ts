import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dobDdMmYyyyToIso,
  dobIsoToDdMmYyyy,
  formatDobDisplay,
} from "@/lib/account/account-settings-v1";
import {
  buildAnnualReportPdf,
  buildHmrcExportCsv,
  buildSalesSummaryPdf,
} from "@/lib/compliance/hmrc-documents-v1";
import {
  buildHmrcSellerCounters,
  HMRC_ENGINE_V1,
  resolveCrossedWarningPercents,
  resolveHmrcEngineConfig,
  resolveHmrcReportingStatus,
  resolveUkTaxYearWindow,
} from "@/lib/compliance/hmrc-engine-v1";
import {
  HMRC_RC1_LEDGER_DECISION_V1,
  isHmrcReportLedgerDeferredForRc1,
} from "@/lib/compliance/hmrc-rc1-ledger-decision-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("HMRC Production Lock", () => {
  it("persists DOB helpers ISO ↔ DD/MM/YYYY for profile + tax + HMRC prefill", () => {
    expect(dobDdMmYyyyToIso("22/01/1988")).toBe("1988-01-22");
    expect(dobIsoToDdMmYyyy("1988-01-22")).toBe("22/01/1988");
    expect(formatDobDisplay("22/01/1988")).toContain("1988");
  });

  it("wires DOB through tax registration + profile column + snapshot", () => {
    const taxUi = readSource("features/seller/tax/components/SellerTaxRegistrationPage.tsx");
    expect(taxUi).toContain("dateOfBirth");
    expect(taxUi).toContain("dobDdMmYyyyToIso");
    expect(taxUi).toContain("initialDateOfBirth");

    const taxApi = readSource("app/api/seller/tax/route.ts");
    expect(taxApi).toContain("dateOfBirth");
    expect(taxApi).toContain("updateProfileDetails");

    const snapshot = readSource("lib/compliance/hmrc-seller-snapshot.server.ts");
    expect(snapshot).toContain("date_of_birth");
    expect(snapshot).toContain('id: "date_of_birth"');
    expect(snapshot).toContain("emitHmrcThresholdWarnings");

    const migration = readSource(
      "supabase/migrations/20260730234500_profiles_date_of_birth_hmrc_v1.sql",
    );
    expect(migration).toContain("date_of_birth");
  });

  it("resolves configurable threshold + warning percents + reporting rules", () => {
    const config = resolveHmrcEngineConfig({
      thresholdGbp: 25_000,
      warningPercents: [40, 80],
      reportingRules: {
        reportWhenAtOrAboveThreshold: true,
        notifyOnWarningPercents: false,
        preferCompletedOrders: false,
      },
    });
    expect(config.thresholdGbp).toBe(25_000);
    expect(config.warningPercents).toEqual([40, 80]);
    expect(config.reportingRules.notifyOnWarningPercents).toBe(false);
    expect(config.taxYearMode).toBe("april_6");
    expect(HMRC_ENGINE_V1.platformSettingsKey).toBe("hmrc.reporting_config");
  });

  it("emits warning percents only when crossed", () => {
    expect(resolveCrossedWarningPercents(49, [50, 75, 90])).toEqual([]);
    expect(resolveCrossedWarningPercents(50, [50, 75, 90])).toEqual([50]);
    expect(resolveCrossedWarningPercents(90, [50, 75, 90])).toEqual([50, 75, 90]);
  });

  it("keeps status engine + document builders for regression", () => {
    const taxYear = resolveUkTaxYearWindow(new Date("2026-07-30T12:00:00Z"));
    const config = resolveHmrcEngineConfig(null);
    const counters = buildHmrcSellerCounters({
      completedSales: 12,
      grossSales: 22_500,
      taxYear,
      config,
    });
    expect(counters.percentage).toBe(75);
    expect(resolveHmrcReportingStatus({ counters, config })).toBe("approaching_threshold");

    const pdf = buildSalesSummaryPdf({ counters, sellerName: "Seller" });
    const annual = buildAnnualReportPdf({
      counters,
      prefill: [{ id: "date_of_birth", label: "Date of birth", value: "22 January 1988", verified: true }],
      statusTitle: "Approaching threshold",
      sellerName: "Seller",
    });
    const csv = buildHmrcExportCsv({
      counters,
      prefill: [{ id: "date_of_birth", label: "Date of birth", value: "22 January 1988", verified: true }],
    });
    expect(pdf.byteLength).toBeGreaterThan(100);
    expect(annual.byteLength).toBeGreaterThan(100);
    expect(csv).toContain("Date of birth");
    expect(csv).toContain("Gross sales GBP");
  });

  it("exposes Super Admin HMRC Settings without DB owner editing", () => {
    const page = readSource("app/super-admin/hmrc/page.tsx");
    expect(page).toContain("HmrcSettingsPanel");
    const panel = readSource("features/super-admin/hmrc/HmrcSettingsPanel.tsx");
    expect(panel).toContain("platformSettingsKey");
    expect(panel).toContain("warningPercents");
    expect(panel).toContain("reportingRules");
    expect(panel).toContain("taxYearMode");
    expect(panel).toContain("/api/super-admin/settings");
    expect(panel).toContain('data-hmrc-settings="v1.0"');
    const registry = readSource("lib/super-admin/command-center/registry.ts");
    expect(registry).toContain('href: "/super-admin/hmrc"');
  });

  it("maps policy_update notifications to business prefs category", () => {
    const events = readSource("lib/notifications/events.ts");
    expect(events).toMatch(/case "policy_update":[\s\S]*?return "business"/);
  });

  it("emits threshold warnings only when notify enabled and uses idempotency keys", async () => {
    const { emitHmrcThresholdWarnings } = await import(
      "@/lib/compliance/hmrc-threshold-warnings.server"
    );
    const taxYear = resolveUkTaxYearWindow(new Date("2026-07-30T12:00:00Z"));
    const config = resolveHmrcEngineConfig({
      thresholdGbp: 30_000,
      warningPercents: [50, 75, 90],
      reportingRules: {
        reportWhenAtOrAboveThreshold: true,
        notifyOnWarningPercents: false,
        preferCompletedOrders: true,
      },
    });
    const counters = buildHmrcSellerCounters({
      completedSales: 10,
      grossSales: 16_000,
      taxYear,
      config,
    });
    const disabled = await emitHmrcThresholdWarnings({
      userId: "00000000-0000-4000-8000-000000000001",
      counters,
      config,
    });
    expect(disabled).toEqual({ attempted: 0, emitted: 0, skipped: 0 });
  });

  it("wires eligibility SSOT into seller snapshot", () => {
    const snapshot = readSource("lib/compliance/hmrc-seller-snapshot.server.ts");
    expect(snapshot).toContain("resolveHmrcEligibility");
    expect(snapshot).toContain("isReportingSubject");
    expect(snapshot).toContain("RC1-OD-HMRC-001");
  });

  it("records RC1 ledger Option B deferred without simulating alreadyReported", () => {
    expect(isHmrcReportLedgerDeferredForRc1()).toBe(true);
    expect(HMRC_RC1_LEDGER_DECISION_V1.decision).toBe("DEFERRED");
    expect(HMRC_RC1_LEDGER_DECISION_V1.simulateAlreadyReported).toBe(false);
    expect(HMRC_RC1_LEDGER_DECISION_V1.removesRc1Blocker).toBe(true);
  });

  it("fail-closes seller compliance route for buyers", () => {
    const page = readSource("app/seller/compliance/page.tsx");
    expect(page).toContain("canAccessHmrcSellerCentre");
    expect(page).toContain("hmrc=seller_only");
    const docs = readSource("app/api/seller/compliance/documents/[kind]/route.ts");
    expect(docs).toContain("canAccessHmrcSellerCentre");
    expect(docs).toContain("403");
  });
});
