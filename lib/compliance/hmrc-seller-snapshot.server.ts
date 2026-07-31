import "server-only";

/**
 * HMRC seller snapshot — one seller only, live data, no marketplace aggregates.
 */

import { createClient } from "@/lib/supabase/server";
import { getSellerTaxProfile } from "@/lib/seller/tax/service";
import { getDefaultAddress } from "@/lib/addresses/repository";
import { getPlatformSetting } from "@/lib/super-admin/settings";
import { formatDobDisplay, dobIsoToDdMmYyyy } from "@/lib/account/account-settings-v1";
import { emitHmrcThresholdWarnings } from "@/lib/compliance/hmrc-threshold-warnings.server";
import { resolveHmrcEligibility } from "@/lib/compliance/hmrc-eligibility-v1";
import {
  buildHmrcSellerCounters,
  formatGbp,
  formatUkTaxYearLabel,
  HMRC_ENGINE_V1,
  maskNinoCompact,
  resolveHmrcEngineConfig,
  resolveHmrcReportingStatus,
  resolveHmrcStatusPresentation,
  resolveUkTaxYearWindow,
  type HmrcPrefillField,
  type HmrcStatusPresentation,
} from "@/lib/compliance/hmrc-engine-v1";
import type { UserProfile } from "@/lib/profile/types";
import type {
  HmrcDocumentMeta,
  HmrcSellerSnapshot,
} from "@/lib/compliance/hmrc-snapshot-types-v1";

export type { HmrcDocumentMeta, HmrcSellerSnapshot };
export type { HmrcPrefillField };

function reportingStatusLabel(status: HmrcStatusPresentation["status"]): string {
  switch (status) {
    case "no_action_required":
      return "Below threshold";
    case "approaching_threshold":
      return "Approaching threshold";
    case "reporting_required":
      return "Reporting required";
    case "reported":
      return "Reported";
    case "blocked":
      return "Blocked";
  }
}

function formatAddress(parts: {
  line1: string | null;
  line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
}): string {
  const country =
    !parts.country || parts.country.toUpperCase() === "GB" || parts.country === "United Kingdom"
      ? "United Kingdom"
      : parts.country;
  return [parts.line1, parts.line2, parts.city, parts.postcode, country]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

export async function loadHmrcSellerSnapshot(
  profile: UserProfile,
): Promise<HmrcSellerSnapshot> {
  const taxYear = resolveUkTaxYearWindow();
  const supabase = await createClient();
  const [configRaw, taxProfile, address, orderRows, walletSales, dobRow] = await Promise.all([
    getPlatformSetting(HMRC_ENGINE_V1.platformSettingsKey, {
      thresholdGbp: HMRC_ENGINE_V1.defaultThresholdGbp,
      warningPercents: [...HMRC_ENGINE_V1.defaultWarningPercents],
    }),
    getSellerTaxProfile(profile.id),
    getDefaultAddress(profile.id, "shipping").catch(() => null),
    loadCompletedSellerOrders(profile.id, taxYear.startIso, taxYear.endIso),
    loadWalletSalesInWindow(profile.id, taxYear.startIso, taxYear.endIso),
    supabase
      .from("profiles")
      .select("date_of_birth")
      .eq("id", profile.id)
      .maybeSingle()
      .then((result) => result.data ?? null, () => null),
  ]);

  const config = resolveHmrcEngineConfig(configRaw);

  // Prefer completed orders; fall back to wallet sales if orders empty but wallet has sales.
  const useOrders = config.reportingRules.preferCompletedOrders && orderRows.count > 0;
  const completedSales = useOrders ? orderRows.count : walletSales.count > 0 ? walletSales.count : orderRows.count;
  const grossSales = useOrders ? orderRows.gross : walletSales.count > 0 ? walletSales.gross : orderRows.gross;

  const alreadyReported = false; // RC1-OD-HMRC-001: ledger DEFERRED — never simulate reported.
  const blocked = false;

  const counters = buildHmrcSellerCounters({
    completedSales,
    grossSales,
    taxYear,
    config,
    numberOfReports: 0,
    lastReport: null,
    alreadyReported,
    blocked,
  });

  const eligibility = resolveHmrcEligibility({
    authenticated: true,
    hasSellingActivity: Boolean(profile.capabilities?.hasSellingActivity),
    role: profile.role,
    completedSales: counters.completedSales,
    grossSales: counters.grossSales,
  });

  // Only emit threshold notifications for reporting subjects (never pure buyers).
  if (eligibility.isReportingSubject) {
    void emitHmrcThresholdWarnings({ userId: profile.id, counters, config });
  }

  const dobIso = dobRow && "date_of_birth" in dobRow ? (dobRow.date_of_birth as string | null) : null;

  const profileIncomplete =
    !taxProfile?.submittedAt ||
    !taxProfile.fullName ||
    !(taxProfile.addressLine1 || address?.addressLine) ||
    !dobIso;

  const statusKey = resolveHmrcReportingStatus({
    counters,
    config,
    blocked,
    alreadyReported,
    profileIncomplete,
  });
  const status = resolveHmrcStatusPresentation(statusKey, counters);

  const fullName = taxProfile?.fullName?.trim() || profile.fullName?.trim() || "Not provided";
  const email = taxProfile?.email?.trim() || profile.email?.trim() || "Not provided";
  const addressValue =
    formatAddress({
      line1: taxProfile?.addressLine1 ?? address?.addressLine ?? null,
      line2: taxProfile?.addressLine2 ?? address?.addressLine2 ?? null,
      city: taxProfile?.city ?? address?.city ?? null,
      postcode: taxProfile?.postcode ?? address?.postcode ?? null,
      country: taxProfile?.country ?? address?.country ?? "GB",
    }) || "Not provided";

  const dobDisplay = dobIso
    ? formatDobDisplay(dobIsoToDdMmYyyy(dobIso) || dobIso)
    : "Not provided";

  const prefill: HmrcPrefillField[] = [
    {
      id: "full_name",
      label: "Full name",
      value: fullName,
      verified: Boolean(profile.verified && fullName !== "Not provided"),
    },
    {
      id: "address",
      label: "Address",
      value: addressValue,
      verified: Boolean(address?.isDefault && addressValue !== "Not provided"),
    },
    {
      id: "date_of_birth",
      label: "Date of birth",
      value: dobDisplay,
      verified: Boolean(dobIso),
    },
    {
      id: "nino",
      label: "National Insurance number",
      value: maskNinoCompact(taxProfile?.nino),
      verified: Boolean(taxProfile?.nino),
    },
    {
      id: "email",
      label: "Account email",
      value: email,
      verified: Boolean(email.includes("@")),
    },
  ];

  const yearSlug = formatUkTaxYearLabel(taxYear).replace("/", "-");
  const hasActivity = counters.completedSales > 0 || counters.grossSales > 0;

  const documents: HmrcDocumentMeta[] = [
    {
      id: "sales_summary",
      title: "Sales summary",
      description: "Download a summary of your sales",
      filename: `rovexo-hmrc-sales-summary-${yearSlug}.pdf`,
      available: true,
    },
    {
      id: "annual_report",
      title: "Annual report",
      description: "Download your annual sales report",
      filename: `rovexo-hmrc-annual-report-${yearSlug}.pdf`,
      available: true,
    },
    {
      id: "hmrc_export",
      title: "HMRC export",
      description: "CSV export for digital platform reporting records",
      filename: `rovexo-hmrc-export-${yearSlug}.csv`,
      available: hasActivity || Boolean(taxProfile),
    },
  ];

  return {
    taxYear,
    config,
    counters,
    status,
    reportingStatusLabel: reportingStatusLabel(status.status),
    prefill,
    documents,
    taxProfile,
    eligibility,
  };
}

async function loadCompletedSellerOrders(
  sellerId: string,
  startIso: string,
  endIso: string,
): Promise<{ count: number; gross: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, seller_payout, item_price, status, completed_at, delivered_at, paid_at, created_at")
    .eq("seller_id", sellerId)
    .in("status", ["completed", "delivered"]);

  if (error || !data?.length) return { count: 0, gross: 0 };

  let count = 0;
  let gross = 0;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  for (const row of data) {
    const when = row.completed_at ?? row.delivered_at ?? row.paid_at ?? row.created_at;
    const t = new Date(when).getTime();
    if (Number.isNaN(t) || t < start || t > end) continue;
    count += 1;
    gross += Number(row.seller_payout ?? row.item_price ?? 0);
  }
  return { count, gross: Math.round(gross * 100) / 100 };
}

async function loadWalletSalesInWindow(
  userId: string,
  startIso: string,
  endIso: string,
): Promise<{ count: number; gross: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("id, amount, type, created_at")
    .eq("user_id", userId)
    .eq("type", "sale")
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  if (error || !data?.length) return { count: 0, gross: 0 };

  let gross = 0;
  for (const row of data) {
    gross += Number(row.amount ?? 0);
  }
  return { count: data.length, gross: Math.round(gross * 100) / 100 };
}

export function formatHmrcCounterGbp(amount: number): string {
  return formatGbp(amount);
}
