/**
 * Shared HMRC snapshot types (safe for client + server).
 */

import type {
  HmrcEngineConfig,
  HmrcPrefillField,
  HmrcSellerCounters,
  HmrcStatusPresentation,
  HmrcTaxYearWindow,
} from "@/lib/compliance/hmrc-engine-v1";
import type { HmrcEligibilityResult } from "@/lib/compliance/hmrc-eligibility-v1";
import type { SellerTaxProfile } from "@/lib/seller/tax/types";

export type HmrcDocumentMeta = {
  id: "sales_summary" | "annual_report" | "hmrc_export";
  title: string;
  description: string;
  filename: string;
  available: boolean;
};

export type HmrcSellerSnapshot = {
  taxYear: HmrcTaxYearWindow;
  config: HmrcEngineConfig;
  counters: HmrcSellerCounters;
  status: HmrcStatusPresentation;
  reportingStatusLabel: string;
  prefill: HmrcPrefillField[];
  documents: HmrcDocumentMeta[];
  taxProfile: SellerTaxProfile | null;
  eligibility: HmrcEligibilityResult;
};
