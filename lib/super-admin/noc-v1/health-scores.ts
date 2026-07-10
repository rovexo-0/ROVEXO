import type { HealthCheckResult, HealthStatus } from "@/lib/ops/health-types";
import type { SendcloudHealthResult } from "@/lib/shipping/sendcloud/types";
import type { NocHealthCard, NocHealthStatus } from "@/lib/super-admin/noc-v1/types";

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreFromCheck(check: HealthCheckResult): number {
  if (check.status === "unhealthy") {
    return clampScore(25 - Math.min(25, check.latencyMs / 120));
  }
  if (check.status === "degraded") {
    return clampScore(68 - Math.min(28, check.latencyMs / 80));
  }
  if (check.latencyMs >= 2000) return 72;
  if (check.latencyMs >= 1000) return 84;
  if (check.latencyMs >= 500) return 92;
  return 98;
}

function averageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return clampScore(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function statusFromScore(score: number, options?: { maintenance?: boolean; offline?: boolean }): NocHealthStatus {
  if (options?.offline) return "offline";
  if (options?.maintenance) return "maintenance";
  if (score >= 90) return "healthy";
  if (score >= 70) return "warning";
  if (score >= 40) return "critical";
  return "offline";
}

function card(id: string, label: string, score: number, detail?: string, options?: { maintenance?: boolean; offline?: boolean }): NocHealthCard {
  return {
    id,
    label,
    score: clampScore(score),
    status: statusFromScore(score, options),
    detail,
  };
}

export type BuildNocHealthScoresInput = {
  platformStatus: HealthStatus;
  checks: {
    api: HealthCheckResult;
    database: HealthCheckResult;
    storage: HealthCheckResult;
    stripe: HealthCheckResult;
    redis: HealthCheckResult;
    cron: HealthCheckResult;
  };
  sendcloudHealth: SendcloudHealthResult;
  stripeConfigured: boolean;
  sendcloudConfigured: boolean;
  pendingModeration: number;
  totalListings: number;
  failedPayments24h: number;
  completedOrders: number;
  failedShippingOrders: number;
  labelsToday: number;
  authErrors24h: number;
  securityErrors24h: number;
  aiRequests24h: number;
  aiErrors24h: number;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  databaseMigrationPending: boolean;
};

export function buildNocHealthScores(input: BuildNocHealthScoresInput): NocHealthCard[] {
  const apiScore = scoreFromCheck(input.checks.api);
  const databaseScore = scoreFromCheck(input.checks.database);
  const storageScore = scoreFromCheck(input.checks.storage);
  const stripeScore = input.stripeConfigured ? scoreFromCheck(input.checks.stripe) : 55;
  const redisScore = scoreFromCheck(input.checks.redis);
  const cronScore = scoreFromCheck(input.checks.cron);

  const sendcloudScore = !input.sendcloudConfigured
    ? 50
    : input.sendcloudHealth.status === "healthy"
      ? clampScore(96 - Math.min(40, input.sendcloudHealth.latencyMs / 50))
      : input.sendcloudHealth.status === "degraded"
        ? 62
        : 18;

  const moderationRatio =
    input.totalListings > 0 ? input.pendingModeration / input.totalListings : 0;
  const marketplaceScore = clampScore(
    96 -
      moderationRatio * 120 -
      (input.failedShippingOrders > 0 ? 8 : 0) -
      (input.labelsToday === 0 && input.sendcloudConfigured ? 4 : 0),
  );

  const securityScore = clampScore(100 - input.authErrors24h * 3 - input.securityErrors24h * 4);

  const paymentDenominator = Math.max(1, input.completedOrders + input.failedPayments24h);
  const paymentScore = clampScore(
    (input.stripeConfigured ? stripeScore : 55) -
      (input.failedPayments24h / paymentDenominator) * 35,
  );

  const shippingDenominator = Math.max(1, input.labelsToday + input.failedShippingOrders);
  const shippingScore = clampScore(
    sendcloudScore - (input.failedShippingOrders / shippingDenominator) * 30,
  );

  const aiScore =
    input.aiRequests24h > 0
      ? clampScore(((input.aiRequests24h - input.aiErrors24h) / input.aiRequests24h) * 100)
      : 100;

  const infraScore = clampScore(
    averageScore([apiScore, redisScore, cronScore, databaseScore]) -
      Math.max(0, input.cpuUsagePercent - 80) * 0.4 -
      Math.max(0, input.ramUsagePercent - 85) * 0.5,
  );

  const coreScores = [apiScore, databaseScore, storageScore];
  if (input.stripeConfigured) coreScores.push(stripeScore);
  coreScores.push(redisScore, cronScore);

  const overallScore = averageScore([
    averageScore(coreScores),
    marketplaceScore,
    securityScore,
    paymentScore,
    shippingScore,
    aiScore,
    infraScore,
  ]);

  return [
    card("overall", "Overall Platform Health", overallScore, `Platform ${input.platformStatus}`),
    card("marketplace", "Marketplace Health", marketplaceScore, `${input.pendingModeration} pending review`),
    card("security", "Security Health", securityScore, `${input.securityErrors24h} security events (24h)`),
    card(
      "payments",
      "Payment Health",
      paymentScore,
      input.stripeConfigured ? undefined : "Stripe not configured",
      { maintenance: !input.stripeConfigured },
    ),
    card(
      "shipping",
      "Shipping Health",
      shippingScore,
      input.sendcloudHealth.message,
      { maintenance: !input.sendcloudConfigured, offline: input.sendcloudHealth.status === "unhealthy" },
    ),
    card("database", "Database Health", databaseScore, input.checks.database.message),
    card("api", "API Health", apiScore, `${input.checks.api.latencyMs}ms latency`),
    card("ai", "AI Health", aiScore, `${input.aiErrors24h} failures (24h)`),
    card(
      "infrastructure",
      "Infrastructure Health",
      infraScore,
      input.databaseMigrationPending ? "Pending migrations" : undefined,
      { maintenance: input.databaseMigrationPending },
    ),
  ];
}
