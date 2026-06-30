export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export type HealthCheckResult = {
  status: HealthStatus;
  latencyMs: number;
  message?: string;
};

export type PlatformHealthReport = {
  status: HealthStatus;
  timestamp: string;
  version: string;
  checks: {
    api: HealthCheckResult;
    database: HealthCheckResult;
    storage: HealthCheckResult;
    stripe: HealthCheckResult;
    redis: HealthCheckResult;
    cron: HealthCheckResult;
    email: HealthCheckResult;
    push: HealthCheckResult;
  };
};
