export type PlatformOverallStatus = "healthy" | "degraded" | "unhealthy";
export type HealthStatus = PlatformOverallStatus | "not_configured";

export type HealthCheckResult = {
  status: HealthStatus;
  latencyMs: number;
  message?: string;
};

export type PlatformHealthReport = {
  status: PlatformOverallStatus;
  timestamp: string;
  version: string;
  checks: {
    api: HealthCheckResult;
    database: HealthCheckResult;
    storage: HealthCheckResult;
    authentication: HealthCheckResult;
    stripe: HealthCheckResult;
    redis: HealthCheckResult;
    cron: HealthCheckResult;
    email: HealthCheckResult;
    push: HealthCheckResult;
  };
};
