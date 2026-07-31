/**
 * ROVEXO HMRC Reporting Centre UI v1.1
 * Presentation SSOT — counters/status come from HMRC Engine.
 */

export const HMRC_REPORTING_CENTRE_UI_V1 = {
  id: "hmrc-reporting-centre-ui-v1",
  version: "1.1.0",
  status: "ACTIVE",
  route: "/seller/compliance",
  title: "HMRC Reporting Centre",
  subtitle: "Stay informed about your UK tax reporting obligations.",
  sections: [
    "status",
    "your_reporting",
    "reporting_progress",
    "prefill",
    "documents",
    "important_information",
    "need_help",
  ] as const,
} as const;

/** @deprecated Use resolveUkTaxYearWindow + formatUkTaxYearLabel from hmrc-engine-v1 */
export { formatGbp, formatUkTaxYearLabel as resolveUkTaxYearLabel } from "@/lib/compliance/hmrc-engine-v1";

export {
  buildHmrcSellerCounters,
  resolveHmrcReportingStatus,
  resolveHmrcStatusPresentation,
  resolveUkTaxYearWindow,
} from "@/lib/compliance/hmrc-engine-v1";
