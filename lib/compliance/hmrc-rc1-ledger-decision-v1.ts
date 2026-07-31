/**
 * ROVEXO RC1 — HMRC Report Ledger Decision (KI-006)
 *
 * STATUS: OWNER-AUTHORIZED DECISION RECORDED · LEDGER DEFERRED
 *
 * RC1 HMRC scope = threshold monitoring · seller guidance · document availability ·
 * self-service reporting centre. Persistent filing ledger is out of RC1 scope.
 */

export const HMRC_RC1_LEDGER_DECISION_V1 = {
  id: "RC1-OD-HMRC-001",
  version: "1.0.0",
  decidedAt: "2026-07-31",
  decision: "DEFERRED" as const,
  option: "B" as const,
  title: "HMRC report ledger deferred from RC1",
  rationale: [
    "RC1 HMRC deliverable is the Reporting Centre: threshold status, guidance, prefill, and self-serve PDF/CSV.",
    "No HMRC filing / DAC7 submission API ships in RC1.",
    "alreadyReported must not be simulated — status stays live from counters until a future ledger exists.",
    "Implementing a fake reported state without a ledger would produce false certification.",
  ] as const,
  rc1InScope: [
    "threshold_monitoring",
    "seller_guidance",
    "document_availability",
    "self_service_reporting",
    "threshold_notifications",
  ] as const,
  deferredToNextCycle: [
    "persistent_hmrc_report_ledger",
    "alreadyReported_from_stored_data",
    "hmrc_reports_database_schema",
    "filing_audit_trail",
    "dac7_submission",
  ] as const,
  alreadyReportedPolicy: "OUT_OF_LIVE_FLOW" as const,
  /** Must remain false / unused in live status until ledger ships. */
  simulateAlreadyReported: false,
  removesRc1Blocker: true,
  certificationImpact:
    "Ledger is no longer an RC1 release blocker. HMRC may reach PASS+FREEZE after Owner walkthrough without a report store.",
} as const;

export type HmrcRc1LedgerDecisionV1 = typeof HMRC_RC1_LEDGER_DECISION_V1;

export function isHmrcReportLedgerRequiredForRc1(): boolean {
  return !isHmrcReportLedgerDeferredForRc1();
}

export function isHmrcReportLedgerDeferredForRc1(): boolean {
  return HMRC_RC1_LEDGER_DECISION_V1.decision === "DEFERRED";
}
