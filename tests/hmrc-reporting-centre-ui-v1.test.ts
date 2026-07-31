import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildAnnualReportPdf,
  buildHmrcExportCsv,
  buildSalesSummaryPdf,
  hmrcDocumentFilename,
} from "@/lib/compliance/hmrc-documents-v1";
import {
  buildHmrcSellerCounters,
  formatUkTaxYearLabel,
  maskNinoCompact,
  resolveHmrcEngineConfig,
  resolveHmrcReportingStatus,
  resolveHmrcStatusPresentation,
  resolveUkTaxYearWindow,
} from "@/lib/compliance/hmrc-engine-v1";
import { resolveHmrcEligibility } from "@/lib/compliance/hmrc-eligibility-v1";
import { HMRC_REPORTING_CENTRE_UI_V1 } from "@/lib/compliance/hmrc-reporting-centre-ui-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("HMRC Reporting Centre UI v1.1 + Engine", () => {
  it("locks route and approved section set", () => {
    expect(HMRC_REPORTING_CENTRE_UI_V1.route).toBe("/seller/compliance");
    expect(HMRC_REPORTING_CENTRE_UI_V1.title).toBe("HMRC Reporting Centre");
    expect(HMRC_REPORTING_CENTRE_UI_V1.sections).toContain("reporting_progress");
    expect(HMRC_REPORTING_CENTRE_UI_V1.sections).toContain("documents");
  });

  it("resolves UK tax year label as YYYY/YY", () => {
    const window = resolveUkTaxYearWindow(new Date("2026-07-30T12:00:00Z"));
    expect(formatUkTaxYearLabel(window)).toBe("2026/27");
    expect(window.startIso.startsWith("2026-04-06")).toBe(true);
  });

  it("calculates counters and below-threshold status with zero demo data", () => {
    const taxYear = resolveUkTaxYearWindow(new Date("2026-07-30T12:00:00Z"));
    const config = resolveHmrcEngineConfig({ thresholdGbp: 30_000, warningPercents: [50, 75, 90] });
    const counters = buildHmrcSellerCounters({
      completedSales: 0,
      grossSales: 0,
      taxYear,
      config,
    });
    expect(counters.completedSales).toBe(0);
    expect(counters.grossSales).toBe(0);
    expect(counters.percentage).toBe(0);
    expect(counters.reportRequired).toBe(false);
    expect(resolveHmrcReportingStatus({ counters, config })).toBe("no_action_required");
    expect(resolveHmrcStatusPresentation("no_action_required", counters).title).toBe(
      "No action required",
    );
  });

  it("marks approaching and reporting required from live totals", () => {
    const taxYear = resolveUkTaxYearWindow(new Date("2026-07-30T12:00:00Z"));
    const config = resolveHmrcEngineConfig(null);
    const approaching = buildHmrcSellerCounters({
      completedSales: 10,
      grossSales: 16_000,
      taxYear,
      config,
    });
    expect(approaching.percentage).toBe(53);
    expect(resolveHmrcReportingStatus({ counters: approaching, config })).toBe(
      "approaching_threshold",
    );

    const required = buildHmrcSellerCounters({
      completedSales: 40,
      grossSales: 30_000,
      taxYear,
      config,
    });
    expect(required.reportRequired).toBe(true);
    expect(resolveHmrcReportingStatus({ counters: required, config })).toBe("reporting_required");
  });

  it("handles below / exactly / above threshold boundaries", () => {
    const taxYear = resolveUkTaxYearWindow(new Date("2026-07-30T12:00:00Z"));
    const config = resolveHmrcEngineConfig({ thresholdGbp: 30_000, warningPercents: [50, 75, 90] });

    const below = buildHmrcSellerCounters({
      completedSales: 1,
      grossSales: 29_999.99,
      taxYear,
      config,
    });
    expect(below.reportRequired).toBe(false);
    expect(below.remainingToThreshold).toBe(0.01);
    expect(resolveHmrcReportingStatus({ counters: below, config })).toBe("approaching_threshold");

    const exact = buildHmrcSellerCounters({
      completedSales: 2,
      grossSales: 30_000,
      taxYear,
      config,
    });
    expect(exact.reportRequired).toBe(true);
    expect(exact.remainingToThreshold).toBe(0);
    expect(exact.percentage).toBe(100);
    expect(resolveHmrcReportingStatus({ counters: exact, config })).toBe("reporting_required");

    const above = buildHmrcSellerCounters({
      completedSales: 3,
      grossSales: 45_000.55,
      taxYear,
      config,
    });
    expect(above.reportRequired).toBe(true);
    expect(above.percentage).toBe(100);
    expect(above.remainingToThreshold).toBe(0);
  });

  it("resolves UK tax year edges around 6 April", () => {
    const before = resolveUkTaxYearWindow(new Date(2026, 3, 5, 12, 0, 0));
    expect(formatUkTaxYearLabel(before)).toBe("2025/26");
    const on = resolveUkTaxYearWindow(new Date(2026, 3, 6, 12, 0, 0));
    expect(formatUkTaxYearLabel(on)).toBe("2026/27");
  });

  it("excludes pure buyers from reporting obligations and seller centre", () => {
    const buyer = resolveHmrcEligibility({
      authenticated: true,
      hasSellingActivity: false,
      role: "buyer",
      completedSales: 0,
      grossSales: 0,
    });
    expect(buyer.canViewCentre).toBe(false);
    expect(buyer.isReportingSubject).toBe(false);
    expect(buyer.buyerExcludedFromObligation).toBe(true);

    const seller = resolveHmrcEligibility({
      authenticated: true,
      hasSellingActivity: true,
      role: "buyer",
      completedSales: 0,
      grossSales: 0,
    });
    expect(seller.canViewCentre).toBe(true);
    expect(seller.isReportingSubject).toBe(true);
    expect(seller.buyerExcludedFromObligation).toBe(false);
  });

  it("masks NINO and builds documents with correct filenames", () => {
    expect(maskNinoCompact("AB123456C")).toMatch(/^AB•+C$/);
    expect(hmrcDocumentFilename("sales_summary", "2026/27")).toBe(
      "rovexo-hmrc-sales-summary-2026-27.pdf",
    );
    const counters = buildHmrcSellerCounters({
      completedSales: 2,
      grossSales: 100,
      taxYear: resolveUkTaxYearWindow(new Date("2026-07-30T12:00:00Z")),
      config: resolveHmrcEngineConfig(null),
    });
    const pdf = buildSalesSummaryPdf({ counters, sellerName: "Test Seller" });
    expect(pdf.byteLength).toBeGreaterThan(100);
    const annual = buildAnnualReportPdf({
      counters,
      prefill: [{ id: "email", label: "Account email", value: "a@b.com", verified: true }],
      statusTitle: "No action required",
      sellerName: "Test Seller",
    });
    expect(annual.byteLength).toBeGreaterThan(100);
    expect(buildHmrcExportCsv({ counters, prefill: [] })).toContain("Gross sales GBP");
  });

  it("renders approved centre shell without demo seeds", () => {
    const ui = readSource("features/seller/compliance/ComplianceDashboard.tsx");
    expect(ui).toContain("HMRC_REPORTING_CENTRE_UI_V1");
    expect(ui).toContain("Your reporting");
    expect(ui).toContain("Reporting progress");
    expect(ui).toContain("Review pre-filled information");
    expect(ui).toContain("/api/seller/compliance/documents/");
    expect(ui).toContain("Need help?");
    expect(ui).toContain("Tax year");
    expect(ui).toContain('data-hmrc-reporting-centre="v1.1"');
    expect(ui).not.toContain("Calendar year");
    expect(ui).not.toContain("seedDemo");
    expect(ui).not.toContain("£4,250");
    expect(ui).not.toContain("John Smith");
  });
});
