/**
 * ROVEXO HMRC Engine v1.0 — threshold monitoring + reporting counters.
 * Seller-scoped only. No marketplace aggregates. No demo values.
 */

export const HMRC_ENGINE_V1 = {
  id: "hmrc-engine-v1",
  version: "1.0.0",
  platformSettingsKey: "hmrc.reporting_config",
  defaultThresholdGbp: 30_000,
  /** Warn when gross reaches this % of threshold. */
  defaultWarningPercents: [50, 75, 90] as const,
  status: "ACTIVE",
} as const;

export type HmrcReportingStatus =
  | "no_action_required"
  | "approaching_threshold"
  | "reporting_required"
  | "reported"
  | "blocked";

export type HmrcEngineConfig = {
  thresholdGbp: number;
  warningPercents: number[];
  reportingRules: {
    reportWhenAtOrAboveThreshold: boolean;
    notifyOnWarningPercents: boolean;
    preferCompletedOrders: boolean;
  };
  taxYearMode: "april_6";
};

export type HmrcTaxYearWindow = {
  /** Display label e.g. 2025/26 */
  label: string;
  startYear: number;
  endYear: number;
  startIso: string;
  endIso: string;
};

export type HmrcSellerCounters = {
  completedSales: number;
  grossSales: number;
  currentTaxYear: string;
  threshold: number;
  remainingToThreshold: number;
  percentage: number;
  reportRequired: boolean;
  numberOfReports: number;
  lastReport: string | null;
  nextReportDue: string | null;
};

export type HmrcPrefillField = {
  id: "full_name" | "address" | "date_of_birth" | "nino" | "email";
  label: string;
  value: string;
  verified: boolean;
};

export type HmrcStatusPresentation = {
  status: HmrcReportingStatus;
  title: string;
  description: string;
  tone: "green" | "amber" | "red" | "blue" | "slate";
  ctaLabel: string | null;
  ctaHref: string | null;
};

export function resolveHmrcEngineConfig(raw: unknown): HmrcEngineConfig {
  const fallback: HmrcEngineConfig = {
    thresholdGbp: HMRC_ENGINE_V1.defaultThresholdGbp,
    warningPercents: [...HMRC_ENGINE_V1.defaultWarningPercents],
    reportingRules: {
      reportWhenAtOrAboveThreshold: true,
      notifyOnWarningPercents: true,
      preferCompletedOrders: true,
    },
    taxYearMode: "april_6",
  };
  if (!raw || typeof raw !== "object") return fallback;
  const row = raw as Record<string, unknown>;
  const threshold = Number(row.thresholdGbp ?? row.threshold_gbp ?? fallback.thresholdGbp);
  const percentsRaw = row.warningPercents ?? row.warning_percents ?? fallback.warningPercents;
  const warningPercents = Array.isArray(percentsRaw)
    ? percentsRaw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0 && n < 100)
    : fallback.warningPercents;
  const rulesRaw =
    row.reportingRules && typeof row.reportingRules === "object"
      ? (row.reportingRules as Record<string, unknown>)
      : {};
  return {
    thresholdGbp: Number.isFinite(threshold) && threshold > 0 ? threshold : fallback.thresholdGbp,
    warningPercents: warningPercents.length
      ? [...new Set(warningPercents)].sort((a, b) => a - b)
      : fallback.warningPercents,
    reportingRules: {
      reportWhenAtOrAboveThreshold:
        rulesRaw.reportWhenAtOrAboveThreshold !== undefined
          ? Boolean(rulesRaw.reportWhenAtOrAboveThreshold)
          : fallback.reportingRules.reportWhenAtOrAboveThreshold,
      notifyOnWarningPercents:
        rulesRaw.notifyOnWarningPercents !== undefined
          ? Boolean(rulesRaw.notifyOnWarningPercents)
          : fallback.reportingRules.notifyOnWarningPercents,
      preferCompletedOrders:
        rulesRaw.preferCompletedOrders !== undefined
          ? Boolean(rulesRaw.preferCompletedOrders)
          : fallback.reportingRules.preferCompletedOrders,
    },
    taxYearMode: "april_6",
  };
}

/** UK tax year starts 6 April. */
export function resolveUkTaxYearWindow(now = new Date()): HmrcTaxYearWindow {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const startYear = month > 3 || (month === 3 && day >= 6) ? year : year - 1;
  const endYear = startYear + 1;
  const start = new Date(Date.UTC(startYear, 3, 6, 0, 0, 0));
  const end = new Date(Date.UTC(endYear, 3, 5, 23, 59, 59));
  const label = `${startYear}/${String(endYear).slice(2)}`;
  return {
    label,
    startYear,
    endYear,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

/** Canonical UK tax year label: 2025/26 */
export function formatUkTaxYearLabel(window: HmrcTaxYearWindow): string {
  return window.label;
}

export function isDateInUkTaxYear(iso: string | null | undefined, window: HmrcTaxYearWindow): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= new Date(window.startIso).getTime() && t <= new Date(window.endIso).getTime();
}

export function buildHmrcSellerCounters(input: {
  completedSales: number;
  grossSales: number;
  taxYear: HmrcTaxYearWindow;
  config: HmrcEngineConfig;
  numberOfReports?: number;
  lastReport?: string | null;
  blocked?: boolean;
  alreadyReported?: boolean;
}): HmrcSellerCounters {
  const threshold = input.config.thresholdGbp;
  const gross = Math.max(0, round2(input.grossSales));
  const percentage = threshold > 0 ? Math.min(100, Math.round((gross / threshold) * 100)) : 0;
  const remaining = Math.max(0, round2(threshold - gross));
  const reportRequired = gross >= threshold;

  let nextReportDue: string | null = null;
  if (reportRequired && !input.alreadyReported) {
    // Platform reporting typically due after tax year ends (31 Jan following).
    nextReportDue = `${input.taxYear.endYear + 1}-01-31`;
  } else if (!reportRequired) {
    nextReportDue = null;
  }

  return {
    completedSales: Math.max(0, Math.floor(input.completedSales)),
    grossSales: gross,
    currentTaxYear: formatUkTaxYearLabel(input.taxYear),
    threshold,
    remainingToThreshold: remaining,
    percentage,
    reportRequired,
    numberOfReports: Math.max(0, input.numberOfReports ?? 0),
    lastReport: input.lastReport ?? null,
    nextReportDue,
  };
}

export function resolveHmrcReportingStatus(input: {
  counters: HmrcSellerCounters;
  config: HmrcEngineConfig;
  blocked?: boolean;
  alreadyReported?: boolean;
  profileIncomplete?: boolean;
}): HmrcReportingStatus {
  if (input.blocked) return "blocked";
  if (input.alreadyReported) return "reported";
  if (input.counters.reportRequired) return "reporting_required";

  const warnAt = Math.min(...input.config.warningPercents.map((p) => p));
  if (input.counters.percentage >= warnAt) return "approaching_threshold";

  // Incomplete profile does not override "no action" when below threshold —
  // Edit CTA lives in prefill section.
  void input.profileIncomplete;
  return "no_action_required";
}

export function resolveHmrcStatusPresentation(
  status: HmrcReportingStatus,
  counters: HmrcSellerCounters,
): HmrcStatusPresentation {
  switch (status) {
    case "no_action_required":
      return {
        status,
        title: "No action required",
        description:
          "You're below the reporting threshold. We will notify you if any action is needed.",
        tone: "green",
        ctaLabel: null,
        ctaHref: null,
      };
    case "approaching_threshold":
      return {
        status,
        title: "Approaching threshold",
        description: `You have reached ${counters.percentage}% of the £${counters.threshold.toLocaleString("en-GB")} HMRC reporting threshold.`,
        tone: "amber",
        ctaLabel: "Review information",
        ctaHref: "/seller/tax",
      };
    case "reporting_required":
      return {
        status,
        title: "Reporting required",
        description:
          "Your sales have reached the HMRC reporting threshold. Confirm your details so ROVEXO can report when required by law.",
        tone: "red",
        ctaLabel: "Confirm tax profile",
        ctaHref: "/seller/tax",
      };
    case "reported":
      return {
        status,
        title: "Reported",
        description: "Your seller information for this tax year has been prepared for HMRC where required.",
        tone: "blue",
        ctaLabel: "View documents",
        ctaHref: "#hmrc-documents",
      };
    case "blocked":
      return {
        status,
        title: "Blocked",
        description:
          "Reporting is temporarily blocked for this account. Contact support if you need help.",
        tone: "slate",
        ctaLabel: "Contact support",
        ctaHref: "/support",
      };
  }
}

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Which configured warning percents the seller has reached (inclusive). */
export function resolveCrossedWarningPercents(
  percentage: number,
  warningPercents: number[],
): number[] {
  return warningPercents.filter((p) => percentage >= p).sort((a, b) => a - b);
}

export function maskNino(nino: string | null | undefined): string {
  const raw = (nino ?? "").replace(/\s+/g, "").toUpperCase();
  if (!raw) return "Not provided";
  if (raw.length < 5) return "••••••••";
  return `${raw.slice(0, 2)} •• •• ${raw.slice(-2, -1)} ${raw.slice(-1)}`.replace(
    /(\w{2})\s••\s••\s(\w)\s(\w)/,
    "$1 •• •• •$3",
  );
}

/** Standard NI mask: AB••••••C */
export function maskNinoCompact(nino: string | null | undefined): string {
  const raw = (nino ?? "").replace(/\s+/g, "").toUpperCase();
  if (!raw) return "Not provided";
  if (raw.length < 3) return "••••••••";
  return `${raw.slice(0, 2)}${"•".repeat(Math.max(4, raw.length - 3))}${raw.slice(-1)}`;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
