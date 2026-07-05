import type { CommandCenterMetric, CommandCenterMetricFormat } from "@/lib/super-admin/command-center-v1/types";
import { formatCommandCenterMetric } from "@/features/super-admin/command-center-v1/lib/format-metric";

export type LiveStatusBadgeVariant =
  | "live"
  | "collecting"
  | "tracking"
  | "waiting"
  | "no-data"
  | "unavailable"
  | "secure"
  | "healthy";

export type MetricDisplayResult = {
  kind: "value" | "empty";
  displayText: string;
  badge?: { label: string; variant: LiveStatusBadgeVariant };
  tooltip: string;
  ariaLabel: string;
};

type EmptyStateRule = {
  display: string;
  badge: { label: string; variant: LiveStatusBadgeVariant };
  tooltip: string;
};

const STATUS_STRING_PATTERN =
  /healthy|degraded|unhealthy|online|offline|live|warning|critical|configured|connected|synced|pending|active|idle|passing|not configured/i;

function isStatusString(value: string): boolean {
  return STATUS_STRING_PATTERN.test(value);
}

function isEmptyNumericValue(value: number): boolean {
  return value === 0;
}

function matchRule(metricId: string, rules: Array<[RegExp, EmptyStateRule]>): EmptyStateRule | null {
  for (const [pattern, rule] of rules) {
    if (pattern.test(metricId)) return rule;
  }
  return null;
}

const EXPLICIT_RULES: Array<[RegExp, EmptyStateRule]> = [
  [
    /^usersOnline$|^online$|^activeSessions$|^realtimeSessionCount$|^realtimeUsers$/,
    {
      display: "Waiting for first login",
      badge: { label: "Waiting", variant: "waiting" },
      tooltip: "No authenticated users are currently online.",
    },
  ],
  [
    /^verifiedBusinesses$|^premiumBusinesses$/,
    {
      display: "No verified businesses yet",
      badge: { label: "Tracking", variant: "tracking" },
      tooltip: "No verified business accounts have been recorded yet.",
    },
  ],
  [
    /^liveListings$|^totalListings$|^newListingsToday$|^listingsCreated$/,
    {
      display: "No listings yet",
      badge: { label: "Collecting", variant: "collecting" },
      tooltip: "No marketplace listings have been published yet.",
    },
  ],
  [
    /^ordersToday$|^completed$|^purchases$|^conversions$/,
    {
      display: "No orders recorded",
      badge: { label: "Collecting", variant: "collecting" },
      tooltip: "No orders have been recorded for this period yet.",
    },
  ],
  [
    /^revenueToday$|^revenueWeek$|^revenueMonth$|^revenueYear$|^platformRevenue$|^businessRevenue$|^todaysRevenue$/,
    {
      display: "No completed payments yet",
      badge: { label: "Waiting", variant: "waiting" },
      tooltip: "No completed payment revenue has been recorded yet.",
    },
  ],
  [
    /^withdrawals$|^bankTransfers$|^settlementQueue$/,
    {
      display: "No withdrawals recorded",
      badge: { label: "No Data Yet", variant: "no-data" },
      tooltip: "No withdrawal transactions have been recorded yet.",
    },
  ],
  [
    /^disputes$|^chargebacks$|^openDisputes$/,
    {
      display: "No active disputes",
      badge: { label: "System Secure", variant: "secure" },
      tooltip: "No active payment disputes are open.",
    },
  ],
  [
    /^delivered$|^deliveredToday$/,
    {
      display: "Waiting for first delivery",
      badge: { label: "Waiting", variant: "waiting" },
      tooltip: "No completed deliveries have been recorded yet.",
    },
  ],
  [
    /^labelsGenerated$|^liveLabelsCreated$/,
    {
      display: "No shipping labels generated yet",
      badge: { label: "No Data Yet", variant: "no-data" },
      tooltip: "No shipping labels have been generated yet.",
    },
  ],
  [
    /^inTransit$|^packagesCollected$|^packagesInTransit$/,
    {
      display: "No parcels currently in transit",
      badge: { label: "Tracking", variant: "tracking" },
      tooltip: "No parcels are currently in transit.",
    },
  ],
  [
    /^averageDeliveryTimeDays$/,
    {
      display: "No deliveries recorded yet",
      badge: { label: "Waiting", variant: "waiting" },
      tooltip: "No completed deliveries have been recorded yet.",
    },
  ],
  [
    /^bandwidthMbps$/,
    {
      display: "Bandwidth telemetry unavailable",
      badge: { label: "Unavailable", variant: "unavailable" },
      tooltip: "Bandwidth telemetry provider has not reported data.",
    },
  ],
  [
    /^averageResponseMinutes$/,
    {
      display: "No support SLA records available",
      badge: { label: "No Data Yet", variant: "no-data" },
      tooltip: "No support SLA records are available yet.",
    },
  ],
  [
    /^openTickets$|^pendingTickets$|^chatQueue$/,
    {
      display: "No support activity yet",
      badge: { label: "Healthy", variant: "healthy" },
      tooltip: "No support SLA records available.",
    },
  ],
  [
    /^messages$|^unreadMessages$/,
    {
      display: "No conversations yet",
      badge: { label: "No Data Yet", variant: "no-data" },
      tooltip: "No buyer or seller conversations have been recorded yet.",
    },
  ],
  [
    /^reviews$/,
    {
      display: "Waiting for first review",
      badge: { label: "Collecting", variant: "collecting" },
      tooltip: "No marketplace reviews have been submitted yet.",
    },
  ],
  [
    /^imageAi$/,
    {
      display: "No AI image processing yet",
      badge: { label: "Waiting", variant: "waiting" },
      tooltip: "No AI image processing events have been recorded yet.",
    },
  ],
  [
    /^aiRequests$|^promptQueue$|^categoryAi$|^moderationAi$|^descriptionAi$|^translationAi$|^recommendationAi$|^searchAi$/,
    {
      display: "AI awaiting requests",
      badge: { label: "Waiting", variant: "waiting" },
      tooltip: "No AI orchestration requests have been recorded yet.",
    },
  ],
  [
    /threatScore|blockedRequests|blockedBots|blockedIps|failedLogins|bruteForce|apiAbuse|malwareDetection|spamDetection|suspiciousUsers|permissionViolations|sessionHijackingDetection|criticalAlerts|authenticationEvents|riskScore|liveThreatLevel|omegaEngine/i,
    {
      display: "No threats detected",
      badge: { label: "System Secure", variant: "secure" },
      tooltip: "No security threats have been detected.",
    },
  ],
  [
    /^memoryUsagePercent$|^cpuUsagePercent$|^cacheHitRatio$|^cacheHit$|^pageSpeed$|^pageSpeedMs$|^bounceRate$|^ctr$|^conversions$/,
    {
      display: "Awaiting telemetry",
      badge: { label: "Collecting", variant: "collecting" },
      tooltip: "Waiting for performance events.",
    },
  ],
  [
    /latency|responseTime|ssrLatency|rscLatency|isrLatency|paymentApiLatencyMs|latencyMs$/,
    {
      display: "Monitoring...",
      badge: { label: "Collecting", variant: "collecting" },
      tooltip: "Waiting for performance events.",
    },
  ],
  [
    /^connections$/,
    {
      display: "Waiting for telemetry",
      badge: { label: "Collecting", variant: "collecting" },
      tooltip: "Database connection telemetry has not reported data yet.",
    },
  ],
  [
    /^countries$|^trafficSources$|^deviceTypes$|^operatingSystems$|^browsers$|^trendingCategories$|^topPages$|^topListings$|^sessions$|^guests$|^registrationsPerHour$|^newToday$|^newThisWeek$|^peakToday$/,
    {
      display: "Collecting Live Data",
      badge: { label: "Collecting", variant: "collecting" },
      tooltip: "Live analytics data is still being collected.",
    },
  ],
  [
    /^profit$|^fees$|^commissions$|^buyerProtectionFees$|^buyerProtectionRevenue$|^shippingRevenue$|^subscriptionRevenue$|^averageBasket$|^averageRevenue$|^averageShippingCost$|^marketplaceCommission$/,
    {
      display: "Collecting Live Data",
      badge: { label: "Collecting", variant: "collecting" },
      tooltip: "Financial metrics will populate after live transactions are recorded.",
    },
  ],
  [
    /^workers$|^cronJobs$|^recentDeployments$|^systemErrors$|^criticalErrors$|^adminActivity$|^analyticsEvents24h$/,
    {
      display: "Collecting Live Data",
      badge: { label: "Collecting", variant: "collecting" },
      tooltip: "Operational metrics will appear after live platform events are recorded.",
    },
  ],
];

const FORMAT_FALLBACKS: Record<CommandCenterMetricFormat, EmptyStateRule> = {
  percent: {
    display: "Awaiting production metrics",
    badge: { label: "Collecting", variant: "collecting" },
    tooltip: "Production percentage metrics are not available yet.",
  },
  duration: {
    display: "Waiting for telemetry",
    badge: { label: "Collecting", variant: "collecting" },
    tooltip: "Waiting for performance events.",
  },
  currency: {
    display: "No completed payments yet",
    badge: { label: "Waiting", variant: "waiting" },
    tooltip: "No completed payment revenue has been recorded yet.",
  },
  number: {
    display: "Collecting Live Data",
    badge: { label: "Collecting", variant: "collecting" },
    tooltip: "Live metrics will populate after platform events are recorded.",
  },
  status: {
    display: "Collecting Live Data",
    badge: { label: "Collecting", variant: "collecting" },
    tooltip: "Status telemetry is still being collected.",
  },
  text: {
    display: "Collecting Live Data",
    badge: { label: "Collecting", variant: "collecting" },
    tooltip: "Live metrics will populate after platform events are recorded.",
  },
};

function resolveEmptyState(metric: CommandCenterMetric): EmptyStateRule {
  const explicit = matchRule(metric.id, EXPLICIT_RULES);
  if (explicit) return explicit;

  const format = metric.format ?? "number";
  return FORMAT_FALLBACKS[format];
}

function resolveUnavailableStatus(metric: CommandCenterMetric, value: string): MetricDisplayResult | null {
  if (!/not configured|unavailable|offline/i.test(value)) return null;

  return {
    kind: "empty",
    displayText: value,
    badge: { label: "Unavailable", variant: "unavailable" },
    tooltip: `${metric.label} is not configured or unavailable in this environment.`,
    ariaLabel: `${metric.label}: ${value}. ${metric.label} is not configured or unavailable in this environment.`,
  };
}

export function resolveMetricDisplay(metric: CommandCenterMetric): MetricDisplayResult {
  const format = metric.format ?? "number";

  if (typeof metric.value === "string") {
    const unavailable = resolveUnavailableStatus(metric, metric.value);
    if (unavailable) return unavailable;

    if (isStatusString(metric.value)) {
      const displayText = metric.value;
      return {
        kind: "value",
        displayText,
        tooltip: `${metric.label} is currently ${displayText.toLowerCase()}.`,
        ariaLabel: `${metric.label}: ${displayText}`,
      };
    }

    if (metric.value.trim() === "") {
      const empty = resolveEmptyState(metric);
      return {
        kind: "empty",
        displayText: empty.display,
        badge: empty.badge,
        tooltip: empty.tooltip,
        ariaLabel: `${metric.label}: ${empty.display}. ${empty.tooltip}`,
      };
    }

    return {
      kind: "value",
      displayText: metric.value,
      tooltip: metric.label,
      ariaLabel: `${metric.label}: ${metric.value}`,
    };
  }

  if (!isEmptyNumericValue(metric.value)) {
    const displayText = formatCommandCenterMetric(metric.value, format);
    return {
      kind: "value",
      displayText,
      tooltip: `${metric.label} is ${displayText}.`,
      ariaLabel: `${metric.label}: ${displayText}`,
    };
  }

  const empty = resolveEmptyState(metric);
  return {
    kind: "empty",
    displayText: empty.display,
    badge: empty.badge,
    tooltip: empty.tooltip,
    ariaLabel: `${metric.label}: ${empty.display}. ${empty.tooltip}`,
  };
}

export function isChartSeriesEmpty(points: number[]): boolean {
  return points.length === 0 || points.every((point) => point === 0);
}

export function resolveChartHeaderDisplay(seriesId: string, points: number[]): MetricDisplayResult {
  if (!isChartSeriesEmpty(points)) {
    const latest = points.at(-1) ?? 0;
    return {
      kind: "value",
      displayText: new Intl.NumberFormat("en-GB").format(latest),
      tooltip: `Latest ${seriesId} value from production telemetry.`,
      ariaLabel: `Latest value: ${latest}`,
    };
  }

  const telemetryCharts = new Set(["cpu", "memory", "api", "database"]);
  if (telemetryCharts.has(seriesId)) {
    return {
      kind: "empty",
      displayText: "Collecting",
      badge: { label: "Collecting", variant: "collecting" },
      tooltip: "Waiting for performance events.",
      ariaLabel: "Collecting production telemetry.",
    };
  }

  return {
    kind: "empty",
    displayText: "Collecting",
    badge: { label: "Collecting", variant: "collecting" },
    tooltip: "Charts will automatically populate after live events are recorded.",
    ariaLabel: "Collecting production data.",
  };
}
